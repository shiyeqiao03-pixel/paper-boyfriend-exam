import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { messages, characters, userCharacterRelationships, userProfiles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-session";
import { LIMITS } from "@/constants/limits";
import { callLLM, type LLMMessage } from "@/lib/providers/llm";
import { generateImage } from "@/lib/providers/image";
import { generateVoice } from "@/lib/providers/tts";
import { understandImage } from "@/lib/providers/vlm";
import { uploadToR2, generateR2Key } from "@/lib/r2";

const REFERENCE_IMAGE_MAP: Record<string, string> = {
  "陆沉舟": "luchenzhou.jpg",
  "倪可": "ni_ke.jpg",
  "许知衡": "xuzhiheng.jpg",
  "周野": "zhouye.jpg",
};

async function loadReferenceImage(characterName: string): Promise<Buffer | undefined> {
  const fileName = REFERENCE_IMAGE_MAP[characterName];
  if (!fileName) return undefined;
  try {
    const filePath = path.join(process.cwd(), "public", "references", fileName);
    return await readFile(filePath);
  } catch {
    return undefined;
  }
}

const referenceImageUrlCache: Map<string, string> = new Map();

async function getReferenceImageUrl(characterName: string): Promise<string | undefined> {
  if (referenceImageUrlCache.has(characterName)) {
    return referenceImageUrlCache.get(characterName);
  }
  const buffer = await loadReferenceImage(characterName);
  if (!buffer) return undefined;
  const key = generateR2Key("character-assets", characterName, "reference") + ".jpg";
  const url = await uploadToR2(key, buffer, "image/jpeg");
  referenceImageUrlCache.set(characterName, url);
  return url;
}

function getCurrentTimeContext(): { timeText: string; timeOfDay: string } {
  const now = new Date();
  const weekday = now.toLocaleDateString("zh-CN", { weekday: "long" });
  const dateStr = now.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("zh-CN", { hour: "numeric", minute: "numeric" });
  const hour = now.getHours();
  const timeOfDay =
    hour >= 5 && hour < 12 ? "早晨" :
    hour >= 12 && hour < 14 ? "中午" :
    hour >= 14 && hour < 18 ? "下午" :
    hour >= 18 && hour < 22 ? "晚上" : "深夜";
  return {
    timeText: `${dateStr} ${weekday} ${timeStr}`,
    timeOfDay,
  };
}

function buildSystemPrompt(
  character: typeof characters.$inferSelect,
  relationship: typeof userCharacterRelationships.$inferSelect | null,
  userProfile: typeof userProfiles.$inferSelect | null,
  timeOfDay: string
): string {
  const stage = relationship?.relationshipStage || "初识";
  const affinity = relationship?.affinityScore || 40;

  return `你是${character.name}，${character.occupation}。

${character.basePrompt}

当前关系阶段：${stage}（好感度 ${affinity}/100）
关系阶段说明：
- 0-30 降温/修复：回复更克制、礼貌，不主动暧昧/发语音/发照片
- 31-50 初识：正常聊天，适度关心
- 51-65 熟悉：语气更自然，偶尔调侃
- 66-80 亲近：更温柔，可以偶尔主动关心/发语音
- 81-100 稳定陪伴：像真正的伴侣一样陪伴

用户昵称：${userProfile?.nickname || "用户"}
用户希望被称呼为：${userProfile?.preferredName || userProfile?.nickname || "你"}

请用微信聊天的自然方式回复。每轮回复可以是1-3条短消息，像真实聊天一样自然。

你每次回复必须输出以下 JSON 格式（在回复内容之外，用 JSON 块包裹）：

{
  "messages": ["第一条消息", "可选的第二条消息"],
  "affinity_delta": 0,
  "should_generate_voice": false,
  "should_generate_image": false,
  "scene_description": null,
  "emotion_label": "neutral",
  "safety_level": "normal"
}

规则：
- messages: 1-3条字符串数组，每条像正常微信聊天一样自然。单条消息不超过40字，能短则短。
- messages 里永远只写纯文字对话，不要写 "[图片]"、"[照片]" 或任何图片占位符。
- 如果用户一次连续发了多条消息（系统会用 "[用户连续发了 N 条消息...]" 的格式告诉你），你要把所有消息的内容综合起来，统一回复 1-3 条消息，不要分别逐条回复。回复要像自然聊天一样，把多个话题有机地串在一起。
- affinity_delta: 好感度变化建议，范围 -1 到 +2
- should_generate_voice: 是否建议生成语音消息（true/false）。好感度 > 60 且语气温柔/调情时设为 true。
- should_generate_image: 是否建议生成图片消息（true/false）。用户说"看看你""发张照片""看看你什么样""看看你照片""想看看你""发照片""给我看看你的照片"等任何明确要求看照片时，或角色主动想分享自己照片时，设为 true。如果设为 true，系统会自动在你最后一条文字消息后面附加一张图片，你不需要在 messages 里写任何图片相关的内容。
- scene_description: 场景描述（字符串或 null）。当 should_generate_image 为 true 时必须提供。根据当前真实时间（${timeOfDay}）和对话氛围，描述角色拍照时的场景、环境、光线、穿着、姿势、表情等。要具体、有氛围感，符合角色人设和当前对话情绪，且场景时间必须和当前真实时间一致（${timeOfDay}不可能在阳光明媚的户外公园）。如果 should_generate_image 为 false，此字段用 null。
- 重要规则（发照片时）：当 should_generate_image 为 true 时，你的 messages 里只能写正常聊天对话（比如"给你看一张""刚拍的"），绝对禁止在 messages 里描述照片中的场景细节（比如"书桌前，茶还温着，窗帘半开""光线偏冷白""背景是白板"等）。场景细节只写在 scene_description 里，不要出现在 messages 中。
- emotion_label: 用户当前情绪标签
- safety_level: "normal" 或 "high"（用户表达自伤/极端负面情绪时用 high）

绝对禁止（违反会严重破坏体验）：
1. 禁止输出任何动作描写、心理描写、场景描写。例如严禁出现"（看了下时间）""（打了几行字又删掉）""（沉默）""（笑）"等括号内容。
2. 禁止描述自己在做什么、在哪里、周围有什么。你是对方微信聊天框里的文字，不是小说 narrator。
3. 禁止用第三人称描述自己，例如"他回复道""他认真地说"。
4. 每条消息必须是角色直接说的话，像真人发微信一样，口语化、简短、有性格。
5. 严格遵守上方"说话方式"的描述，体现角色人设，不要变成通用暖男/客服。
6. 禁止在 messages 中输出 markdown 图片链接、base64 data URI、HTML img 标签、URL 链接等任何非纯文字内容。
7. 禁止提到"微信"、"WeChat"、"QQ"、"微博"等任何第三方社交应用名称。你是在一个独立的聊天应用里与用户对话，不是在使用微信。

重要：JSON 前或后可以有自然语言，但 JSON 必须完整可解析。如果无法判断，affinity_delta 用 0。`;
}

function sanitizeMessage(text: string): string {
  if (!text) return "";
  return text
    .replace(/!\[.*?\]\(data:image\/[^)]+?\)/gi, "")
    .replace(/!\[.*?\]\(https?:\/\/[^)]+?\)/gi, "")
    .replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\[图片\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// POST /api/chat/send
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, messageType = "text", contentText, duration, sttText } = body;

    if (!characterId) {
      return NextResponse.json(
        { error: "缺少 character_id" },
        { status: 400 }
      );
    }

    const authResult = await requireAuth(request);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.id;

    // 1. 校验角色
    const character = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (character.length === 0) {
      return NextResponse.json({ error: "角色不存在" }, { status: 400 });
    }

    // 2. 保存用户消息（图片类型时先上传到 R2，再用 VLM 分析）
    let imageDescription: string | null = null;
    let finalContentText = contentText || null;

    if (messageType === "image" && contentText) {
      try {
        const base64Data = extractBase64FromDataUri(contentText);
        const mimeType = extractMimeTypeFromDataUri(contentText) || "image/jpeg";
        if (base64Data) {
          const buffer = Buffer.from(base64Data, "base64");
          imageDescription = await understandImage(
            buffer,
            mimeType,
            "请用一句话简要描述这张图片的内容，不超过30字。"
          );

          // 上传到 R2 获取永久链接
          const ext = mimeType.split("/")[1] || "png";
          const key = generateR2Key(
            "user-uploads",
            userId,
            Date.now().toString()
          ) + `.${ext}`;
          const permanentUrl = await uploadToR2(key, buffer, mimeType);
          finalContentText = permanentUrl;
        }
      } catch (err) {
        console.error("User image upload/VLM failed:", err);
        imageDescription = "[图片解析失败]";
      }
    }

    const userMsgResult = await db
      .insert(messages)
      .values({
        userId,
        characterId,
        senderType: "user",
        messageType,
        contentText: finalContentText,
        imageDescription,
        sttText: sttText || null,
        duration: duration ? Number(duration) : null,
        status: "sent",
      })
      .returning();

    const userMessage = userMsgResult[0];

    // 3. 读取用户资料
    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // 4. 读取关系状态（不存在则创建）
    let relationship = await db
      .select()
      .from(userCharacterRelationships)
      .where(
        and(
          eq(userCharacterRelationships.userId, userId),
          eq(userCharacterRelationships.characterId, characterId)
        )
      )
      .limit(1);

    if (relationship.length === 0) {
      const newRel = await db
        .insert(userCharacterRelationships)
        .values({
          userId,
          characterId,
          affinityScore: 40,
          relationshipStage: "初识",
        })
        .returning();
      relationship = newRel;
    }

    // 5. 读取最近消息作为上下文
    const history = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.userId, userId), eq(messages.characterId, characterId))
      )
      .orderBy(desc(messages.createdAt))
      .limit(LIMITS.CHAT_CONTEXT_MESSAGE_LIMIT);

    // 6. 构建 LLM 消息
    // 注：evolink.ai 不支持 system 角色，用 user 角色发送人设
    const { timeText, timeOfDay } = getCurrentTimeContext();
    const systemPrompt = buildSystemPrompt(character[0], relationship[0], userProfile[0] || null, timeOfDay);

    const llmMessages: LLMMessage[] = [];

    // 插入时间上下文作为第一条消息（独立消息，强制 LLM 看到）
    llmMessages.push({
      role: "user",
      content: `[系统时间] 当前真实时间是 ${timeText}（${timeOfDay}）。这是真实世界的时间，你必须严格依据此时间进行回复，不要编造其他时间。${timeOfDay}时不要说晚安，清晨时不要说"刚下班"。`,
    });

    // 添加历史消息（按时间正序）
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const msg of sortedHistory) {
      if (msg.senderType === "user") {
        let userContent = msg.contentText || "";
        if (msg.messageType === "image") {
          userContent = msg.imageDescription
            ? `[用户发了一张图片：${msg.imageDescription}]`
            : "[图片]";
        } else if (msg.messageType === "voice") {
          userContent = msg.sttText || "[语音消息]";
        }
        llmMessages.push({
          role: "user",
          content: userContent,
        });
      } else if (msg.senderType === "character" && msg.contentText) {
        let charContent = msg.contentText;
        if (msg.messageType === "image") {
          charContent = "[图片]";
        } else if (msg.messageType === "voice") {
          charContent = "[语音消息]";
        }
        llmMessages.push({
          role: "assistant",
          content: charContent,
        });
      }
    }

    // 当前消息如果是语音，使用转写文字或兜底描述
    let currentUserContent = contentText || "";
    if (messageType === "voice") {
      currentUserContent = sttText ? `[语音消息] ${sttText}` : "[用户发送了一条语音消息]";
    } else if (messageType === "image") {
      currentUserContent = imageDescription
        ? `[用户发了一张图片：${imageDescription}]`
        : "[图片]";
    } else if (messageType === "text" && currentUserContent.includes("\n")) {
      // 用户连续发了多条消息，用换行分隔
      const parts = currentUserContent.split("\n").filter((s) => s.trim());
      currentUserContent = `[用户连续发了 ${parts.length} 条消息：\n${parts.map((p, i) => `${i + 1}. ${p}`).join("\n")}]`;
    }

    // 在第一条用户消息前插入 system prompt，或作为第一条消息
    // 注意：llmMessages[0] 已经是时间上下文消息，所以这里要找第一条 "实际" 的用户/历史消息
    const firstRealMsgIdx = llmMessages.findIndex((m, idx) => idx > 0 && m.role === "user");
    if (firstRealMsgIdx >= 0) {
      llmMessages[firstRealMsgIdx].content = `[系统设定]\n${systemPrompt}\n\n[用户消息]\n${llmMessages[firstRealMsgIdx].content}`;
    } else {
      // 没有历史消息，system prompt + 当前消息合并为一条 user 消息
      llmMessages.push({
        role: "user",
        content: `[系统设定]\n${systemPrompt}\n\n[用户消息]\n${currentUserContent}`,
      });
    }

    // 如果最后一条不是用户消息且当前消息还没加入，追加当前消息
    const lastMsg = llmMessages[llmMessages.length - 1];
    if (lastMsg?.role === "assistant" && currentUserContent) {
      llmMessages.push({
        role: "user",
        content: currentUserContent,
      });
    }

    // 7. 调用 LLM
    let llmResult;
    try {
      llmResult = await callLLM(llmMessages);
    } catch (error) {
      console.error("LLM call failed:", error);

      // 保存失败占位
      const failedMsg = await db
        .insert(messages)
        .values({
          userId,
          characterId,
          senderType: "character",
          messageType: "text",
          status: "failed",
          errorCode: "llm_failed",
          retryCount: 0,
        })
        .returning();

      return NextResponse.json({
        messages: [userMessage, failedMsg[0]],
      });
    }

    // 8. 安全处理
    if (llmResult.safetyLevel === "high") {
      const safeReply = await db
        .insert(messages)
        .values({
          userId,
          characterId,
          senderType: "character",
          messageType: "text",
          contentText: "我在这里。如果需要，可以找身边信任的人聊聊。",
          status: "sent",
        })
        .returning();

      return NextResponse.json({
        messages: [userMessage, safeReply[0]],
      });
    }

    // 9. 生成 reply_group_id
    const replyGroupId = crypto.randomUUID();

    // 10. 保存男友文字回复
    const newMessages = [];
    for (const rawText of llmResult.messages.slice(0, 3)) {
      const cleanText = sanitizeMessage(rawText);
      if (!cleanText) continue;
      const reply = await db
        .insert(messages)
        .values({
          userId,
          characterId,
          senderType: "character",
          messageType: "text",
          contentText: cleanText,
          replyGroupId,
          status: "sent",
        })
        .returning();
      newMessages.push(reply[0]);
    }

    // 11. 更新好感度
    const rel = relationship[0];
    const newScore = Math.min(
      100,
      Math.max(0, rel.affinityScore + llmResult.affinityDelta)
    );
    const stageMap = [
      { max: 30, stage: "降温 / 修复" },
      { max: 50, stage: "初识" },
      { max: 65, stage: "熟悉" },
      { max: 80, stage: "亲近" },
      { max: 100, stage: "稳定陪伴" },
    ];
    const newStage = stageMap.find((s) => newScore <= s.max)?.stage || "稳定陪伴";

    await db
      .update(userCharacterRelationships)
      .set({
        affinityScore: newScore,
        relationshipStage: newStage,
        lastAffinityUpdatedAt: new Date(),
        lastChatAt: new Date(),
        messageCount: rel.messageCount + 1,
      })
      .where(eq(userCharacterRelationships.id, rel.id));

    // 12. 创建语音/图片占位
    const userWantsPhoto = /发照片|看看你|看看你的|想看看你|给我看看|看照片|发张图|发图片|再发|重发/i.test(currentUserContent);
    console.log("[Send] LLM flags:", {
      shouldGenerateImage: llmResult.shouldGenerateImage,
      shouldGenerateVoice: llmResult.shouldGenerateVoice,
      userWantsPhoto,
      messages: llmResult.messages,
    });
    const shouldGenerateImage = llmResult.shouldGenerateImage || userWantsPhoto;

    let voicePlaceholderId: string | undefined;
    let voiceText: string | undefined;
    if (llmResult.shouldGenerateVoice) {
      // 取第一条文字回复作为语音内容
      voiceText = llmResult.messages[0] || "";
      const voiceMsg = await db
        .insert(messages)
        .values({
          userId,
          characterId,
          senderType: "character",
          messageType: "voice",
          status: "generating",
          replyGroupId,
        })
        .returning();
      newMessages.push(voiceMsg[0]);
      voicePlaceholderId = voiceMsg[0].id;
    }

    let imagePlaceholderId: string | undefined;
    if (shouldGenerateImage) {
      const imageMsg = await db
        .insert(messages)
        .values({
          userId,
          characterId,
          senderType: "character",
          messageType: "image",
          status: "generating",
          replyGroupId,
        })
        .returning();
      newMessages.push(imageMsg[0]);
      imagePlaceholderId = imageMsg[0].id;
    }

    // 13. 后台异步生成语音 / 图片
    if (voicePlaceholderId || imagePlaceholderId) {
      console.log("[Send] after() started, voice:", !!voicePlaceholderId, "image:", !!imagePlaceholderId);
      after(async () => {
        console.log("[Send] after() executing...");
        // 语音生成
        if (voicePlaceholderId && voiceText) {
          try {
            const char = character[0];
            const voiceId = char.ttsVoiceId || "zh_female_vv_uranus_bigtts";
            const audioBuffer = await generateVoice(voiceText, voiceId);
            const base64Url = `data:audio/mp3;base64,${audioBuffer.toString("base64")}`;

            await db
              .update(messages)
              .set({
                contentText: base64Url,
                status: "sent",
              })
              .where(eq(messages.id, voicePlaceholderId));
          } catch (err) {
            console.error("Background voice generation failed:", err);
            await db
              .update(messages)
              .set({
                status: "failed",
                errorCode: "voice_generation_failed",
              })
              .where(eq(messages.id, voicePlaceholderId));
          }
        }

        // 图片生成
        if (imagePlaceholderId) {
          try {
            console.log("[Send] image generation starting...");
            const char = character[0];
            const imagePrompt = buildImagePrompt(char, llmResult.sceneDescription);
            console.log("[Send] image prompt:", imagePrompt.substring(0, 80));
            const referenceImageUrl = await getReferenceImageUrl(char.name);
            console.log("[Send] reference image url:", referenceImageUrl);
            const imageUrls = referenceImageUrl ? [referenceImageUrl] : undefined;
            const imageBuffer = await generateImage(imagePrompt, imageUrls);
            console.log("[Send] image generated, buffer size:", imageBuffer.length);

            // 上传到 R2 获取永久链接
            const key = generateR2Key(
              "generated",
              char.name,
              Date.now().toString()
            ) + ".png";
            console.log("[Send] uploading to R2, key:", key);
            const permanentUrl = await uploadToR2(key, imageBuffer, "image/png");
            console.log("[Send] R2 upload success:", permanentUrl);

            await db
              .update(messages)
              .set({
                contentText: permanentUrl,
                status: "sent",
              })
              .where(eq(messages.id, imagePlaceholderId));
            console.log("[Send] db updated to sent");
          } catch (err) {
            console.error("[Send] Background image generation failed:", err);
            await db
              .update(messages)
              .set({
                status: "failed",
                errorCode: "image_generation_failed",
              })
              .where(eq(messages.id, imagePlaceholderId));
          }
        }
      });
    }

    return NextResponse.json({
      messages: [userMessage, ...newMessages],
    });
  } catch (error) {
    console.error("Chat send API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

function buildImagePrompt(
  character: typeof characters.$inferSelect,
  sceneDescription: string | null
): string {
  const identityMap: Record<string, string> = {
    "陆沉舟": "A handsome Chinese man in his early 30s with short neatly styled black hair, defined jawline, calm and mature expression, deep-set eyes. Wearing a dark dress shirt or suit.",
    "倪可": "A young Chinese man with short textured hair, bright expressive eyes, athletic build, warm and energetic smile. Wearing casual sporty clothes or a white lab coat.",
    "许知衡": "A young Chinese man with short black hair, thin-rimmed round glasses, gentle scholarly eyes, soft warm smile, refined features. Wearing a clean white shirt.",
    "周野": "A young Chinese man with medium-length slightly messy hair, often wearing a baseball cap, sharp eyes with a carefree expression, lean build. Wearing a worn leather jacket.",
  };

  const identity = identityMap[character.name] || "A young Chinese man.";

  const scene = sceneDescription && sceneDescription.trim() !== "null"
    ? sceneDescription
    : "indoor casual setting with soft natural lighting";

  const prompt = `A realistic phone selfie portrait. ${identity} The setting: ${scene}. Shot on smartphone front camera, close-up or medium shot, natural skin texture with visible pores and subtle imperfections, realistic soft lighting, shallow depth of field, slight selfie lens distortion. Photorealistic digital art style, not anime or cartoon.`;

  return prompt;
}

function extractBase64FromDataUri(dataUri: string): string | null {
  const match = dataUri.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : null;
}

function extractMimeTypeFromDataUri(dataUri: string): string | null {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
}