import { NextRequest, NextResponse } from "next/server";

// POST /api/cron/process-memories
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: 实现记忆提取逻辑
    console.log("Processing memories...");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Process memories cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
