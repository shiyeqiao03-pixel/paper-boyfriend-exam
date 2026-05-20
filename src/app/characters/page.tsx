"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAvatarUrl } from "@/lib/character-avatars";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, ArrowLeft, LogOut } from "lucide-react";

interface Character {
  id: string;
  name: string;
  shortLabel: string;
  selectionText: string;
  introText: string;
  occupation: string;
}

export default function CharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // 忽略错误
    }
    window.location.replace("/auth");
  };

  useEffect(() => {
    fetch("/api/characters")
      .then((res) => res.json())
      .then((data) => {
        setCharacters(data.characters || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSelect = async (characterId: string) => {
    console.log("[选择角色] 点击:", characterId);
    try {
      const res = await fetch(
        `/api/characters/${characterId}/relationship`,
        { method: "GET" }
      );
      console.log("[选择角色] API 状态:", res.status);

      // 未登录，跳转到登录页
      if (res.status === 401) {
        window.location.href = "/auth?logout=1";
        return;
      }

      const data = await res.json();
      console.log("[选择角色] API 数据:", data);

      if (data.relationship?.introSeen) {
        window.location.href = `/chat/${characterId}`;
      } else {
        window.location.href = `/characters/${characterId}/intro`;
      }
    } catch (err) {
      console.error("[选择角色] 出错:", err);
      window.location.href = `/characters/${characterId}/intro`;
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background font-body">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-16 animate-pulse bg-border" />
          <p className="text-sm text-foreground-muted">加载中……</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background font-body">
      {/* Header with Back Link & Logout */}
      <header className="flex items-center justify-between px-8 py-6 lg:px-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-primary"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </header>

      {/* Title */}
      <div className="px-8 pb-4 lg:px-16">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground-muted">
          Select Character
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground lg:text-4xl">
          今天，想和谁聊天？
        </h1>
      </div>

      {/* Character Grid - Editorial Style */}
      <section className="px-8 pb-20 lg:px-16">
        <div className="mx-auto max-w-page">
          <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
            {characters.map((char, index) => {
              const avatarUrl = getAvatarUrl(char.name);
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelect(char.id)}
                  className="group relative bg-background text-left transition-colors hover:bg-cream-100"
                >
                  <div className="flex flex-col gap-0 md:flex-row">
                    {/* Image */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden md:w-[45%]">
                      {avatarUrl && (
                        <Image
                          src={avatarUrl}
                          alt={char.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/40 via-transparent to-transparent md:bg-gradient-to-r" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                      <div>
                        {/* Index Number */}
                        <span className="mb-4 block text-xs text-foreground-muted">
                          0{index + 1}
                        </span>

                        {/* Name & Label */}
                        <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
                          {char.name}
                        </h2>
                        <p className="mb-4 text-sm text-primary">
                          {char.shortLabel}
                        </p>

                        {/* Description */}
                        <p className="mb-6 text-sm leading-relaxed text-foreground-secondary">
                          {char.introText}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-sm font-medium text-primary transition-all group-hover:gap-3">
                        <span>和他聊天</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
