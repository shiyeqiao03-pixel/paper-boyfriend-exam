import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
