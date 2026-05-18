import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

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

    // TODO: 从 session 获取 userId
    const userId = request.headers.get("x-user-id") || "temp-user-id";

    const allMessages = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.userId, userId), eq(messages.characterId, characterId))
      )
      .orderBy(messages.createdAt);

    return NextResponse.json({ messages: allMessages });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
