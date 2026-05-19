import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, generateR2Key } from "@/lib/r2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "请选择要上传的图片" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、WebP、GIF 格式" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "图片大小不能超过 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.type.split("/")[1] || "png";
    const key = generateR2Key(
      "user-uploads",
      Date.now().toString(),
      Math.random().toString(36).substring(2, 8)
    ) + `.${ext}`;

    const permanentUrl = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({
      success: true,
      url: permanentUrl,
      key,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: "上传失败，请稍后重试" },
      { status: 500 }
    );
  }
}
