import { NextRequest, NextResponse } from "next/server";
import { sendDailyLoveLetterToAll } from "@/lib/email";

// GET /api/cron/daily-love-letter
// 每天早上群发情话邮件
export async function GET(request: NextRequest) {
  try {
    // 验证请求：Authorization: Bearer <CRON_SECRET>
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    console.log("[Cron] 开始群发每日情话邮件...");
    await sendDailyLoveLetterToAll();
    console.log("[Cron] 每日情话邮件群发完成");

    return NextResponse.json({
      success: true,
      message: "每日情话发送完成",
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("每日情话发送失败：", error);
    return NextResponse.json(
      { error: "发送失败" },
      { status: 500 }
    );
  }
}
