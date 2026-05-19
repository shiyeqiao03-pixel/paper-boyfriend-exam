import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles, user, emailRecallLogs } from "@/lib/db/schema";
import { sendRecallEmail } from "@/lib/email";
import { eq, and, or, isNull, lte, sql } from "drizzle-orm";

const RECALL_DAYS = 3;
const COOLDOWN_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const recallThreshold = new Date(
      now.getTime() - RECALL_DAYS * 24 * 60 * 60 * 1000
    );
    const cooldownThreshold = new Date(
      now.getTime() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    );

    const inactiveUsers = await db
      .select({
        userId: userProfiles.userId,
        nickname: userProfiles.nickname,
        lastLoginAt: userProfiles.lastLoginAt,
        createdAt: userProfiles.createdAt,
        lastRecallEmailSentAt: userProfiles.lastRecallEmailSentAt,
        email: user.email,
        name: user.name,
      })
      .from(userProfiles)
      .innerJoin(user, eq(userProfiles.userId, user.id))
      .where(
        and(
          eq(userProfiles.emailRecallEnabled, true),
          eq(userProfiles.emailRecallPaused, false),
          or(
            and(
              isNull(userProfiles.lastLoginAt),
              lte(userProfiles.createdAt, recallThreshold)
            ),
            lte(userProfiles.lastLoginAt, recallThreshold)
          ),
          or(
            isNull(userProfiles.lastRecallEmailSentAt),
            lte(userProfiles.lastRecallEmailSentAt, cooldownThreshold)
          )
        )
      );

    let sentCount = 0;
    let failCount = 0;

    for (const u of inactiveUsers) {
      try {
        await sendRecallEmail(u.email, "");

        await db
          .update(userProfiles)
          .set({
            lastRecallEmailSentAt: now,
            recallEmailCount: sql`${userProfiles.recallEmailCount} + 1`,
            updatedAt: now,
          })
          .where(eq(userProfiles.userId, u.userId));

        await db.insert(emailRecallLogs).values({
          userId: u.userId,
          emailType: "recall",
          status: "sent",
          sentAt: now,
        });

        sentCount++;
      } catch (err) {
        console.error(`Recall email failed [${u.email}]:`, err);

        await db.insert(emailRecallLogs).values({
          userId: u.userId,
          emailType: "recall",
          status: "failed",
        });

        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failCount,
      total: inactiveUsers.length,
    });
  } catch (error) {
    console.error("Email recall cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
