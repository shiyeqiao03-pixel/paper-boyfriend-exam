import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface WelcomeEmailProps {
  userName: string;
}

export default function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>欢迎来到纸片人男友，选择你喜欢的角色开始聊天吧</Preview>
      <Body
        style={{
          backgroundColor: "#faf8f5",
          fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#f5ebe0",
              padding: "40px 32px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                letterSpacing: "3px",
                color: "#c9a0a0",
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}
            >
              Paper Boyfriend
            </Text>
            <Text
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#2d2d2d",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              有些话，可以先说给他听
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: "36px 32px" }}>
            <Text
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1a1a1a",
                margin: "0 0 20px",
              }}
            >
              Hi {userName}，欢迎加入纸片人男友 👋
            </Text>

            <Text
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#4a4a4a",
                margin: "0 0 16px",
              }}
            >
              我们为你准备了四位不同性格的角色，从克制冷静的企业掌舵者，到自由浪漫的旅行摄影师，总有一款适合你。
            </Text>

            <Text
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#4a4a4a",
                margin: "0 0 24px",
              }}
            >
              你可以和他们聊天、收语音、解锁专属照片，慢慢建立属于你们的关系。
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Link
                href="https://paperboyfriend.xyz/characters"
                style={{
                  display: "inline-block",
                  backgroundColor: "#c9a0a0",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "14px 36px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                去选择角色
              </Link>
            </Section>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "32px 0 24px",
              }}
            />

            {/* Tips */}
            <Text
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: "#888",
                margin: 0,
              }}
            >
              <strong style={{ color: "#555" }}>小提示：</strong>
              <br />
              • 聊天越多，角色越了解你的喜好
              <br />
              • 好感度提升后会解锁语音和专属照片
              <br />
              • 每天登录可能会收到他的早安消息哦
            </Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: "#f7f5f2",
              padding: "24px 32px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontSize: "12px",
                color: "#999",
                margin: "0 0 8px",
              }}
            >
              纸片人男友 · 所有角色均为虚构，仅供娱乐
            </Text>
            <Text
              style={{
                fontSize: "12px",
                color: "#bbb",
                margin: 0,
              }}
            >
              如有问题，请回复此邮件联系我们
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
