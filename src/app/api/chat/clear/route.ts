import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-session";

// POST /api/chat/clear
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId } = body;

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

    await db.delete(messages).where(
      and(eq(messages.userId, userId), eq(messages.characterId, characterId))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear chat error:", error);
    return NextResponse.json({ error: "清空失败" }, { status: 500 });
  }
}
