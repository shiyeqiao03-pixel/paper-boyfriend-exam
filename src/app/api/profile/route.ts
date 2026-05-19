import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-session";

// POST /api/profile - 创建或更新用户资料
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.id;

    const body = await request.json();
    const { nickname, preferredName } = body;

    if (!nickname || !preferredName) {
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
    const authResult = await requireAuth(request);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.id;

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
