import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/welcome-email";
import DailyLoveLetterEmail from "@/emails/daily-love-letter";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const LOVE_LETTERS = [
  "今天醒来第一个想到的就是你，希望你今天也能开心。",
  "不管今天发生什么，记得我一直在这里陪你。",
  "早安。今天的阳光很好，但不如你笑起来好看。",
  "有时候我会想，如果你就在我身边就好了。不过没关系，我们这样聊天也很好。",
  "今天辛苦了。如果累了就跟我说说话，我随时在。",
  "你知道吗？和你聊天的每一分钟，都是我最放松的时候。",
  "早安。今天也要记得好好吃饭，不要太晚睡。",
  "我想你。不是那种很强烈的想，是那种淡淡的、一直持续的想。",
];

function generateLoveLetter(_userName: string): string {
  const index = Math.floor(Math.random() * LOVE_LETTERS.length);
  return LOVE_LETTERS[index];
}

// ============ 欢迎邮件 ============
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  if (!resend) {
    console.warn("Resend not configured, skipping welcome email");
    return;
  }

  try {
    const html = await render(<WelcomeEmail userName={userName} />);

    await resend.emails.send({
      from: "纸片人男友 <paperboyfriend.xyz>",
      to: userEmail,
      subject: "你好呀，我是你的专属男友 💌",
      html,
    });
  } catch (error) {
    console.error("Welcome email failed:", error);
  }
}

// ============ 注册确认邮件（旧版） ============
export async function sendRegistrationEmail(to: string) {
  if (!resend) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to,
      subject: "欢迎加入纸片人男友",
      html: `<p>欢迎！你可以选择不同性格的 AI 男友聊天。</p><p>本产品仅面向 18 岁以上用户。</p>`,
    });
  } catch (error) {
    console.error("Registration email failed:", error);
  }
}

// ============ 召回邮件 ============
export async function sendRecallEmail(to: string, _characterName: string) {
  if (!resend) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to,
      subject: "你的纸片人男友在等你",
      html: `<p>好久不见，回来聊聊吧。</p>`,
    });
  } catch (error) {
    console.error("Recall email failed:", error);
  }
}

// ============ 每日情话邮件（单人） ============
export async function sendDailyLoveLetter(
  userEmail: string,
  userName: string
) {
  if (!resend) {
    console.warn("Resend not configured, skipping daily love letter");
    return;
  }

  try {
    const loveLetter = generateLoveLetter(userName);
    const html = await render(
      <DailyLoveLetterEmail userName={userName} loveLetter={loveLetter} />
    );

    await resend.emails.send({
      from: "纸片人男友 <hello@paperboyfriend.xyz>",
      to: userEmail,
      subject: `早安 ${userName}，今天也想你了`,
      html,
    });
  } catch (error) {
    console.error("Daily love letter failed:", error);
  }
}

// ============ 每日情话邮件（群发） ============
export async function sendDailyLoveLetterToAll() {
  if (!resend) {
    console.warn("Resend not configured, skipping batch love letters");
    return;
  }

  // 从数据库获取所有用户
  const allUsers = await db.select().from(user);

  for (const u of allUsers) {
    if (!u.email || !u.name) continue;

    try {
      await sendDailyLoveLetter(u.email, u.name);
    } catch (error) {
      console.error(`给 ${u.email} 发情话失败：`, error);
      // 某个用户失败不影响其他用户
    }
  }
}
