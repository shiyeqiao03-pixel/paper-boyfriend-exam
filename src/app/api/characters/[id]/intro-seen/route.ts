import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCharacterRelationships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-session";

// POST /api/characters/:id/intro-seen - 标记角色介绍已查看
export async function POST(
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

    const existing = await db
      .select()
      .from(userCharacterRelationships)
      .where(
        and(
          eq(userCharacterRelationships.userId, userId),
          eq(userCharacterRelationships.characterId, characterId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(userCharacterRelationships)
        .set({
          introSeen: true,
          updatedAt: new Date(),
        })
        .where(eq(userCharacterRelationships.id, existing[0].id))
        .returning();
      return NextResponse.json({ relationship: updated[0] });
    }

    const created = await db
      .insert(userCharacterRelationships)
      .values({
        userId,
        characterId,
        introSeen: true,
      })
      .returning();

    return NextResponse.json({ relationship: created[0] }, { status: 201 });
  } catch (error) {
    console.error("Intro seen API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
