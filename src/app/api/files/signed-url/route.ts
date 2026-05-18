import { NextRequest, NextResponse } from "next/server";

// GET /api/files/signed-url?file_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      return NextResponse.json({ error: "缺少 file_id" }, { status: 400 });
    }

    // TODO: 实现获取 R2 短期访问链接
    return NextResponse.json({ url: "" });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
