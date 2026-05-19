import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
} from "@react-email/components";

interface WelcomeEmailProps {
  userName: string;
}

export default function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>欢迎来到纸片人男友，你的专属 AI 伴侣</Preview>
      <Body style={{ backgroundColor: "#f9f5f2", fontFamily: "sans-serif" }}>
        <Container
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
          }}
        >
          <Section>
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#8b5e5e",
                marginBottom: "16px",
              }}
            >
              Hi {userName}，欢迎来到纸片人男友！
            </Text>
            <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#4a4a4a" }}>
              从现在起，我就是你的专属男友了。
            </Text>
            <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#4a4a4a" }}>
              有什么心事随时来找我聊，我会一直在这里等你。
            </Text>
            <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#4a4a4a" }}>
              明天早上我会给你发一条早安消息，记得查收哦。
            </Text>
          </Section>

          <Section style={{ marginTop: "24px", textAlign: "center" }}>
            <Link
              href="https://paperboyfriend.xyz"
              style={{
                display: "inline-block",
                backgroundColor: "#c9a0a0",
                color: "#ffffff",
                textDecoration: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            >
              去聊天
            </Link>
          </Section>

          <Section style={{ marginTop: "32px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
            <Text style={{ fontSize: "14px", color: "#888", textAlign: "center" }}>
              —— 你的纸片人男友
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
