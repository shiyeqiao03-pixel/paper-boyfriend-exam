"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Character {
  id: string;
  name: string;
  shortLabel: string;
  selectionText: string;
  introText: string;
}

export default function CharactersPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSelect = (characterId: string) => {
    // TODO: 检查是否首次进入，首次进入跳 intro，否则跳 chat
    router.push(`/characters/${characterId}/intro`);
  };

  return (
    <main className="min-h-screen bg-background px-md py-xl">
      <div className="mx-auto max-w-page">
        <h1 className="mb-xl text-center text-xl font-semibold text-foreground">
          今天，想和谁聊天？
        </h1>

        {loading ? (
          <p className="text-center text-foreground-muted">加载中……</p>
        ) : (
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            {characters.map((char) => (
              <div
                key={char.id}
                className="flex flex-col rounded-lg bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-light"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-16 w-16 flex-shrink-0 rounded-full bg-muted" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {char.name}
                    </h2>
                    <p className="text-sm text-accent">{char.shortLabel}</p>
                  </div>
                </div>

                <p className="mb-2 text-sm text-foreground-secondary">
                  {char.introText}
                </p>
                <p className="mb-4 text-sm text-foreground-secondary">
                  {char.selectionText}
                </p>

                <button
                  onClick={() => handleSelect(char.id)}
                  className="mt-auto w-full rounded-button bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-subtle transition-all hover:bg-primary-hover"
                >
                  和他聊天
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
