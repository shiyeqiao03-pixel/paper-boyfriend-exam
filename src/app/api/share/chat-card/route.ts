import { NextRequest, NextResponse } from "next/server";

// POST /api/share/chat-card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: 实现聊天片段分享卡片生成
    return NextResponse.json({ fileId: "temp-share-id" });
  } catch (error) {
    console.error("Share chat card error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
