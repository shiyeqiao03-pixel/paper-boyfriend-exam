import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/characters/:id - 获取单个角色
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db
      .select()
      .from(characters)
      .where(eq(characters.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "角色不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ character: result[0] });
  } catch (error) {
    console.error("Character API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
