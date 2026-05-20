"use client";

import Image from "next/image";
import { MessageCircle, ImageUp, Headphones, Heart } from "lucide-react";

const CHARACTERS = [
  { name: "陆沉舟", label: "克制冷静", img: "/avatars/luchenzhou.jpg" },
  { name: "倪可", label: "阳光嘴贫", img: "/avatars/ni_ke.jpg" },
  { name: "许知衡", label: "理性怪咖", img: "/avatars/xuzhiheng.jpg" },
  { name: "周野", label: "自由浪漫", img: "/avatars/zhouye.jpg" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background font-body">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left - Text */}
        <div className="relative z-10 flex flex-col justify-center px-8 py-20 lg:w-[42%] lg:px-16 lg:py-0">
          <div className="animate-fade-in-up">
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-foreground-muted">
              AI Virtual Companion
            </p>

            <h1 className="mb-8 font-display text-[2.5rem] font-semibold leading-[1.2] tracking-tight text-foreground lg:text-[3.2rem]">
              有些话，
              <br />
              可以先说给他听。
            </h1>

            <p className="mb-10 max-w-sm text-base leading-[1.8] text-foreground-secondary">
              一个 AI 虚拟男友聊天网站。
              <br />
              和不同性格的角色聊天、收语音、看照片，慢慢建立专属关系。
            </p>

            {/* CTA - 原生 a 标签确保绝对可点击 */}
            <a
              href="/auth"
              className="group inline-flex items-center gap-3 border-b-2 border-primary pb-2 text-base font-medium text-primary transition-all hover:border-primary-hover hover:text-primary-hover cursor-pointer"
            >
              开始体验
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>

            <p className="mt-8 text-xs text-foreground-muted">
              仅面向 18 岁以上用户开放
            </p>
          </div>

          <div className="mt-16 hidden lg:block">
            <div className="flex flex-col gap-2 text-xs text-foreground-muted">
              {CHARACTERS.map((c) => (
                <span key={c.name}>{c.name} · {c.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Editorial Magazine Grid */}
        <div className="relative flex h-[50vh] w-full items-center justify-center bg-cream-100 lg:h-screen lg:w-[58%]">
          <div className="grid h-[90%] w-[90%] grid-cols-2 grid-rows-2 gap-5 lg:h-[85%] lg:w-[85%] lg:gap-6">
            {/* 左上 - 陆沉舟 */}
            <div className="relative overflow-hidden rounded-2xl shadow-sm group">
              <Image
                src="/avatars/luchenzhou.jpg"
                alt="陆沉舟"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ objectPosition: 'center 15%' }}
                priority
                sizes="(max-width: 1024px) 45vw, 28vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/50 via-charcoal-900/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="font-display text-lg text-white">陆沉舟</p>
                <p className="mt-0.5 text-xs tracking-wider text-white/70">ENTERPRISE LEADER</p>
              </div>
            </div>

            {/* 右上 - 倪可 */}
            <div className="relative overflow-hidden rounded-2xl shadow-sm group">
              <Image
                src="/avatars/ni_ke.jpg"
                alt="倪可"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ objectPosition: 'center 20%' }}
                priority
                sizes="(max-width: 1024px) 45vw, 28vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/50 via-charcoal-900/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="font-display text-lg text-white">倪可</p>
                <p className="mt-0.5 text-xs tracking-wider text-white/70">DENTIST</p>
              </div>
            </div>

            {/* 左下 - 许知衡 */}
            <div className="relative overflow-hidden rounded-2xl shadow-sm group">
              <Image
                src="/avatars/xuzhiheng.jpg"
                alt="许知衡"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ objectPosition: 'center 20%' }}
                priority
                sizes="(max-width: 1024px) 45vw, 28vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/50 via-charcoal-900/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="font-display text-lg text-white">许知衡</p>
                <p className="mt-0.5 text-xs tracking-wider text-white/70">PHYSICIST</p>
              </div>
            </div>

            {/* 右下 - 周野 */}
            <div className="relative overflow-hidden rounded-2xl shadow-sm group">
              <Image
                src="/avatars/zhouye.jpg"
                alt="周野"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ objectPosition: 'center 20%' }}
                priority
                sizes="(max-width: 1024px) 45vw, 28vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/50 via-charcoal-900/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="font-display text-lg text-white">周野</p>
                <p className="mt-0.5 text-xs tracking-wider text-white/70">PHOTOGRAPHER</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-t border-border bg-cream-100 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-page">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground-muted">
            Why Paper Boyfriend
          </p>
          <h2 className="mb-12 font-display text-2xl font-semibold text-foreground lg:text-3xl">
            不只是聊天，是有人认真听你说话。
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-primary">
                <MessageCircle size={20} />
              </div>
              <h3 className="mb-2 font-display text-lg font-medium text-foreground">专属对话</h3>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                每个角色有独立的性格和记忆，聊天越多，他越懂你。
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-primary">
                <Headphones size={20} />
              </div>
              <h3 className="mb-2 font-display text-lg font-medium text-foreground">语音陪伴</h3>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                专属配音，日常语音消息，睡前小故事，给你真实陪伴感。
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-primary">
                <ImageUp size={20} />
              </div>
              <h3 className="mb-2 font-display text-lg font-medium text-foreground">专属相册</h3>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                好感度升级解锁他的私人照片，记录你们的专属回忆。
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-primary">
                <Heart size={20} />
              </div>
              <h3 className="mb-2 font-display text-lg font-medium text-foreground">情感养成</h3>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                从初识到熟悉，慢慢解锁专属剧情和隐藏互动。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-8 py-10 text-center text-xs text-foreground-muted lg:px-16">
        <p>© 2026 Paper Boyfriend · 所有角色均为虚构，仅供娱乐</p>
        <p className="mt-2">本站内容均为AI生成，不代表任何现实人物或观点</p>
      </footer>
    </main>
  );
}
