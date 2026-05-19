import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCharacterRelationships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-session";

// GET /api/characters/:id/relationship - 获取用户与该角色的关系
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const userId = authResult.user.id;
    const { id: characterId } = await params;

    const result = await db
      .select()
      .from(userCharacterRelationships)
      .where(
        and(
          eq(userCharacterRelationships.userId, userId),
          eq(userCharacterRelationships.characterId, characterId)
        )
      )
      .limit(1);

    return NextResponse.json({
      relationship: result.length > 0 ? result[0] : null,
    });
  } catch (error) {
    console.error("Relationship API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
