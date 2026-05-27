import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-session";

// GET /api/chat/messages?character_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("character_id");

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

    const q = searchParams.get("q");

    const conditions = [
      eq(messages.userId, userId),
      eq(messages.characterId, characterId),
    ];
    if (q) {
      conditions.push(
        or(
          ilike(messages.contentText, `%${q}%`),
          ilike(messages.sttText, `%${q}%`)
        ) as ReturnType<typeof eq>
      );
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(messages.createdAt);

    // 确保字段名是驼峰格式，兼容前端
    const normalizedMessages = allMessages.map((msg) => ({
      id: msg.id,
      userId: msg.userId,
      characterId: msg.characterId,
      senderType: msg.senderType,
      messageType: msg.messageType,
      contentText: msg.contentText,
      sttText: msg.sttText,
      imageDescription: msg.imageDescription,
      status: msg.status,
      createdAt: msg.createdAt,
      replyGroupId: msg.replyGroupId,
      duration: msg.duration,
    }));

    return NextResponse.json({ messages: normalizedMessages });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
