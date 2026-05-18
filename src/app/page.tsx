import Link from "next/link";
import Image from "next/image";

// 头像文件名映射
const avatarMap: Record<string, string> = {
  "陆沉舟": "/avatars/luchenzhou.jpg",
  "倪可": "/avatars/ni_ke.jpg",
  "许知衡": "/avatars/xuzhiheng.jpg",
  "周野": "/avatars/zhouye.jpg",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-page flex-col items-center justify-center px-md md:flex-row md:px-lg">
        {/* 左侧文案 */}
        <div className="flex flex-1 flex-col items-start justify-center py-xl">
          <h1 className="mb-lg text-[28px] font-semibold leading-tight text-foreground md:text-[32px]">
            有些话，可以先说给他听。
          </h1>
          <p className="mb-xl max-w-md text-base leading-relaxed text-foreground-secondary">
            一个 AI 虚拟男友聊天网站。
            <br />
            你可以和不同性格的角色聊天、收语音、看照片，慢慢建立专属关系。
          </p>
          <Link
            href="/auth"
            className="rounded-button bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-subtle transition-all hover:-translate-y-px hover:bg-primary-hover"
          >
            开始体验
          </Link>
          <p className="mt-md text-sm text-foreground-muted">
            仅面向 18 岁以上用户开放
          </p>
        </div>

        {/* 右侧角色卡片 */}
        <div className="flex flex-1 flex-wrap justify-center gap-md py-xl md:justify-end">
          {["陆沉舟", "倪可", "许知衡", "周野"].map((name) => (
            <div
              key={name}
              className="flex h-36 w-28 flex-col items-center justify-center rounded-lg bg-card shadow-card"
            >
              <div className="mb-2 h-12 w-12 rounded-full overflow-hidden">
                <Image
                  src={avatarMap[name]}
                  alt={name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="text-sm font-medium text-foreground">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
