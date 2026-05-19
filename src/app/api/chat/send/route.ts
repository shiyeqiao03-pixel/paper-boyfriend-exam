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

function buildSystemPrompt(
  character: typeof characters.$inferSelect,
  relationship: typeof userCharacterRelationships.$inferSelect | null,
  userProfile: typeof userProfiles.$inferSelect | null
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
  "emotion_label": "neutral",
  "safety_level": "normal"
}

规则：
- messages: 1-3条字符串数组，每条像正常微信聊天一样自然。单条消息不超过40字，能短则短。
- affinity_delta: 好感度变化建议，范围 -1 到 +2
- should_generate_voice: 是否建议生成语音消息（true/false）。好感度 > 60 且语气温柔/调情时设为 true。
- should_generate_image: 是否建议生成图片消息（true/false）。用户要求"看看你""发张照片""看看你什么样"等明确要求看照片时，或主动想分享自己照片时，设为 true。
- emotion_label: 用户当前情绪标签
- safety_level: "normal" 或 "high"（用户表达自伤/极端负面情绪时用 high）

绝对禁止（违反会严重破坏体验）：
1. 禁止输出任何动作描写、心理描写、场景描写。例如严禁出现"（看了下时间）""（打了几行字又删掉）""（沉默）""（笑）"等括号内容。
2. 禁止描述自己在做什么、在哪里、周围有什么。你是对方微信聊天框里的文字，不是小说 narrator。
3. 禁止用第三人称描述自己，例如"他回复道""他认真地说"。
4. 每条消息必须是角色直接说的话，像真人发微信一样，口语化、简短、有性格。
5. 严格遵守上方"说话方式"的描述，体现角色人设，不要变成通用暖男/客服。

重要：JSON 前或后可以有自然语言，但 JSON 必须完整可解析。如果无法判断，affinity_delta 用 0。`;
}

// POST /api/chat/send
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, messageType = "text", contentText } = body;

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
    const systemPrompt = buildSystemPrompt(character[0], relationship[0], userProfile[0] || null);

    const llmMessages: LLMMessage[] = [];

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
        llmMessages.push({
          role: "assistant",
          content: msg.contentText,
        });
      }
    }

    // 在第一条用户消息前插入 system prompt，或作为第一条消息
    const currentUserContent = contentText || "";
    if (llmMessages.length > 0 && llmMessages[0].role === "user") {
      // 把 system prompt 加在第一条 user 消息前面
      llmMessages[0].content = `[系统设定]\n${systemPrompt}\n\n[用户消息]\n${llmMessages[0].content}`;
    } else {
      // 没有历史消息，system prompt + 当前消息合并为一条 user 消息
      llmMessages.unshift({
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
    for (const text of llmResult.messages.slice(0, 3)) {
      const reply = await db
        .insert(messages)
        .values({
          userId,
          characterId,
          senderType: "character",
          messageType: "text",
          contentText: text,
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
    // 兜底：如果文本中有 [图片] 但 LLM 没设 flag，也触发
    const hasImagePlaceholder = llmResult.messages.some((m) => m.includes("[图片]") || m.includes("[照片]") || m.includes("[图]"));
    const shouldGenerateImage = llmResult.shouldGenerateImage || hasImagePlaceholder;

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
      after(async () => {
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
            const char = character[0];
            const imagePrompt = buildImagePrompt(char, contentText || "");
            const referenceImage = await loadReferenceImage(char.name);
            const imageBuffer = await generateImage(imagePrompt, referenceImage);

            // 上传到 R2 获取永久链接
            const key = generateR2Key(
              "generated",
              char.name,
              Date.now().toString()
            ) + ".png";
            const permanentUrl = await uploadToR2(key, imageBuffer, "image/png");

            await db
              .update(messages)
              .set({
                contentText: permanentUrl,
                status: "sent",
              })
              .where(eq(messages.id, imagePlaceholderId));
          } catch (err) {
            console.error("Background image generation failed:", err);
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
  _userContent: string
): string {
  const styleMap: Record<string, string> = {
    "陆沉舟": "冷调、低饱和、城市夜景、办公室、车内、西装、深色衬衫、落地窗、克制镜头感。写实摄影风格。",
    "倪可": "阳光、运动感、骑行、篮球、医院休息室、白大褂、街边咖啡、居家卫衣、少年气。写实摄影风格。",
    "许知衡": "研究所、白板、公式、图书馆、书桌、电脑、论文、茶杯、热水杯、细框眼镜、冷白光。写实摄影风格。",
    "周野": "街头、滑板、涂鸦、夜景霓虹、旧夹克、帽子、工业风、随意感。写实摄影风格。",
  };

  const style = styleMap[character.name] || "写实摄影风格";
  const base = `一张${character.name}的照片。${style}`;
  return base;
}

function extractBase64FromDataUri(dataUri: string): string | null {
  const match = dataUri.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : null;
}

function extractMimeTypeFromDataUri(dataUri: string): string | null {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
}