"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/character-avatars";

interface Character {
  id: string;
  name: string;
  introCardText: string;
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
      // 静默失败，不影响跳转
    }
    router.push(`/chat/${characterId}`);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground-muted">加载中……</p>
      </main>
    );
  }

  if (!character) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground-muted">角色不存在</p>
      </main>
    );
  }

  const avatarUrl = getAvatarUrl(character.name);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-md">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="h-32 w-32 overflow-hidden rounded-2xl bg-muted">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt={character.name}
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="whitespace-pre-line text-center text-base leading-relaxed text-foreground">
          {character.introCardText}
        </div>

        <button
          onClick={handleEnterChat}
          className="mt-8 w-full rounded-button bg-primary py-3 text-base font-semibold text-primary-foreground shadow-subtle transition-all hover:-translate-y-px hover:bg-primary-hover"
        >
          进入聊天
        </button>
      </div>
    </main>
  );
}
