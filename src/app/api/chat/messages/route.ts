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

    return NextResponse.json({ messages: allMessages });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
