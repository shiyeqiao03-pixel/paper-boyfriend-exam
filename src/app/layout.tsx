import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "纸片人男友",
  description: "一个 AI 虚拟男友聊天网站。你可以和不同性格的角色聊天、收语音、看照片，慢慢建立专属关系。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
