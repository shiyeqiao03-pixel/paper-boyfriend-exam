"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isWelcome = params.get("welcome") === "true";
    if (isWelcome) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !preferredName.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), preferredName: preferredName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "保存失败，请重试");
        setLoading(false);
        return;
      }

      router.push("/characters");
    } catch {
      alert("保存失败，请重试");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-md">
      <div className="w-full max-w-sm">
        {showWelcome && (
          <div className="mb-md rounded-md bg-green-50 px-4 py-3 text-center text-sm text-green-700 transition-opacity">
            🎉 注册成功！欢迎来到纸片人男友~
          </div>
        )}

        <h1 className="mb-md text-center text-2xl font-semibold text-foreground">
          先告诉他，该怎么称呼你？
        </h1>

        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label className="mb-1 block text-sm text-foreground-secondary">
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={20}
              className="w-full rounded-md border border-input bg-white px-4 py-3 text-base text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="请输入昵称"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-foreground-secondary">
              希望被怎么称呼
            </label>
            <input
              type="text"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              required
              maxLength={20}
              className="w-full rounded-md border border-input bg-white px-4 py-3 text-base text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="例如：乔乔 / 小鱼 / 直接叫名字"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-button bg-primary py-3 text-base font-semibold text-primary-foreground shadow-subtle transition-all hover:-translate-y-px hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "保存中……" : "开始聊天"}
          </button>
        </form>
      </div>
    </main>
  );
}
