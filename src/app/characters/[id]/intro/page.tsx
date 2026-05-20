"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/character-avatars";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Character {
  id: string;
  name: string;
  introCardText: string;
  occupation: string;
  shortLabel: string;
}

export default function CharacterIntroPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/characters/${characterId}`)
      .then((res) => res.json())
      .then((data) => {
        setCharacter(data.character || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [characterId]);

  const handleEnterChat = async () => {
    try {
      await fetch(`/api/characters/${characterId}/intro-seen`, {
        method: "POST",
      });
    } catch {
      // 静默失败
    }
    router.push(`/chat/${characterId}`);
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

  if (!character) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background font-body">
        <p className="text-foreground-muted">角色不存在</p>
      </main>
    );
  }

  const avatarUrl = getAvatarUrl(character.name);

  return (
    <main className="min-h-screen bg-background font-body">
      {/* Back Link */}
      <div className="px-8 py-6 lg:px-16">
        <Link
          href="/characters"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          返回选择
        </Link>
      </div>

      {/* Main Content - Asymmetric Layout */}
      <div className="flex min-h-[calc(100vh-80px)] flex-col lg:flex-row">
        {/* Left - Image (60%) */}
        <div className="relative h-[50vh] w-full lg:h-auto lg:w-[55%]">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={character.name}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background" />
        </div>

        {/* Right - Story Content (40%) */}
        <div className="flex flex-col justify-center px-8 py-12 lg:w-[45%] lg:px-16 lg:py-20">
          {/* Overline */}
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">
            {character.shortLabel}
          </p>

          {/* Name */}
          <h1 className="mb-8 font-display text-4xl font-semibold leading-tight text-foreground lg:text-5xl">
            {character.name}
          </h1>

          {/* Story Text */}
          <div className="mb-10 max-w-md">
            <p className="whitespace-pre-line text-base leading-[2] text-foreground-secondary">
              {character.introCardText}
            </p>
          </div>

          {/* Divider */}
          <div className="mb-10 h-px w-12 bg-border" />

          {/* Enter Button */}
          <button
            onClick={handleEnterChat}
            className="group inline-flex items-center gap-3 border-b-2 border-primary pb-2 text-base font-medium text-primary transition-all hover:border-primary-hover hover:text-primary-hover"
          >
            进入聊天
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </main>
  );
}
