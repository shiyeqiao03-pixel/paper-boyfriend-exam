"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
        body: JSON.stringify({
          nickname: nickname.trim(),
          preferredName: preferredName.trim(),
        }),
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
    <main className="flex min-h-screen bg-background font-body">
      {/* Left Side - Image */}
      <div className="relative hidden w-[40%] lg:block">
        <Image
          src="/avatars/zhouye.jpg"
          alt="周野"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          {showWelcome && (
            <div className="mb-8 border-l-2 border-primary pl-4 text-sm text-primary">
              注册成功！欢迎来到纸片人男友~
            </div>
          )}

          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground-muted">
            Profile Setup
          </p>
          <h1 className="mb-2 font-display text-3xl font-semibold leading-tight text-foreground">
            先告诉他，
            <br />
            该怎么称呼你？
          </h1>
          <p className="mb-10 text-sm text-foreground-muted">
            这些信息会帮助角色更好地与你交流。
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-foreground-secondary">
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                maxLength={20}
                className="w-full border-b border-border bg-transparent px-0 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
                placeholder="请输入昵称"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground-secondary">
                希望被怎么称呼
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                required
                maxLength={20}
                className="w-full border-b border-border bg-transparent px-0 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
                placeholder="例如：乔乔 / 小鱼 / 直接叫名字"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-charcoal-800 py-3 text-base font-medium text-white transition-all hover:bg-charcoal-700 disabled:opacity-50"
            >
              {loading ? "保存中……" : "开始聊天"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
