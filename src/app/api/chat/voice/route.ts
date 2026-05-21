import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-session";
import { uploadToR2, generateR2Key } from "@/lib/r2";

// POST /api/chat/voice - 上传用户语音到 R2
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.id;

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "缺少音频文件" }, { status: 400 });
    }

    // 读取音频 buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 优先使用前端传来的真实时长，否则兜底估算
    const durationStr = formData.get("duration") as string | null;
    const duration = durationStr ? Number(durationStr) : Math.max(1, Math.round(buffer.length / 2000));

    // 生成唯一 key 并上传
    const ext = audioFile.name.endsWith(".webm") ? "webm" : "mp3";
    const key = generateR2Key("user-uploads", userId, Date.now().toString()) + `.${ext}`;
    const audioUrl = await uploadToR2(key, buffer, audioFile.type || "audio/webm");

    return NextResponse.json({
      success: true,
      audioUrl,
      duration,
    });
  } catch (err: any) {
    console.error("[Voice Upload] error:", err);
    return NextResponse.json(
      { error: err.message || "语音上传失败" },
      { status: 500 }
    );
  }
}
