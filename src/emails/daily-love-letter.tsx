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

interface DailyLoveLetterProps {
  userName: string;
  loveLetter: string;
}

export default function DailyLoveLetter({
  userName,
  loveLetter,
}: DailyLoveLetterProps) {
  return (
    <Html>
      <Head />
      <Preview>早安 {userName}，今天也想你了</Preview>
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
                fontSize: "20px",
                fontWeight: "bold",
                color: "#8b5e5e",
                marginBottom: "24px",
              }}
            >
              早安，{userName}
            </Text>
            <Text
              style={{
                fontSize: "18px",
                lineHeight: "1.8",
                color: "#4a4a4a",
                fontStyle: "italic",
              }}
            >
              {loveLetter}
            </Text>
          </Section>

          <Section style={{ marginTop: "32px", textAlign: "center" }}>
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
              回来找我聊天
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
