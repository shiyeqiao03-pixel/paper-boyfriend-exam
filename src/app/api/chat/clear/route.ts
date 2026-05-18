import { NextRequest, NextResponse } from "next/server";

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

    // TODO: 实现清空聊天记录逻辑
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear chat error:", error);
    return NextResponse.json({ error: "清空失败" }, { status: 500 });
  }
}
