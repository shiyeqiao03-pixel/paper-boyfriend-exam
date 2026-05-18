import { NextRequest, NextResponse } from "next/server";

// POST /api/files/upload-image
export async function POST(request: NextRequest) {
  try {
    // TODO: 实现图片上传到 R2
    return NextResponse.json({ fileId: "temp-file-id" });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
