import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/characters - 获取所有激活的角色
export async function GET() {
  try {
    const allCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.isActive, true))
      .orderBy(characters.sortOrder);

    return NextResponse.json({ characters: allCharacters });
  } catch (error) {
    console.error("Characters API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
