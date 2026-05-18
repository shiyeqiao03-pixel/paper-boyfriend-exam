import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/profile - 创建或更新用户资料
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nickname, preferredName } = body;

    if (!userId || !nickname || !preferredName) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // 更新
      const updated = await db
        .update(userProfiles)
        .set({
          nickname,
          preferredName,
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();

      return NextResponse.json({ profile: updated[0] });
    }

    // 创建
    const created = await db
      .insert(userProfiles)
      .values({
        userId,
        nickname,
        preferredName,
        isAdultConfirmed: true,
        onboardingCompleted: true,
      })
      .returning();

    return NextResponse.json({ profile: created[0] }, { status: 201 });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

// GET /api/profile - 获取当前用户资料
export async function GET(request: NextRequest) {
  try {
    // TODO: 从 session 获取 userId
    // 任务 3 骨架代码，真实 session 校验在联调时接入
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: "用户资料不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: profile[0] });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
