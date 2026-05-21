import { NextResponse } from "next/server";
import { transcribeVoice } from "@/lib/providers/stt";

// 支持最大1分钟语音（Vercel Hobby限制）
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    // 读取音频文件Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 调用STT识别
    const text = await transcribeVoice(buffer);

    return NextResponse.json({
      success: true,
      text,
    });
  } catch (err: any) {
    console.error("STT error:", err);
    return NextResponse.json(
      { error: err.message || "Speech recognition failed" },
      { status: 500 }
    );
  }
}
