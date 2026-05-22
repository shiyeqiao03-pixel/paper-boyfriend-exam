"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isLogin && !isAdult) {
      setError("请确认您已满 18 岁");
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/onboarding",
      });
      if (error) {
        setError(error.message || "登录失败，请重试");
        setLoading(false);
        return;
      }
      window.location.href = "/characters";
      return;
    }

    if (siteKey && !isDev && !turnstileToken) {
      turnstileRef.current?.execute();
      setLoading(false);
      return;
    }

    if (siteKey && !isDev && turnstileToken) {
      try {
        const verifyRes = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
          setError(verifyData.message || "安全验证失败，请重试");
          turnstileRef.current?.reset();
          setTurnstileToken("");
          setLoading(false);
          return;
        }
      } catch {
        setError("验证服务异常，请稍后重试");
        setLoading(false);
        return;
      }
    }

    await authClient.signUp.email(
      {
        email,
        password,
        name: email.split("@")[0],
      },
      {
        onRequest: () => {
          console.log("[注册] 请求发送中...");
        },
        onSuccess: () => {
          setSuccess("🎉 注册成功！欢迎来到纸片人男友~");
          setTimeout(() => {
            window.location.href = "/onboarding?welcome=true";
          }, 1500);
        },
        onError: (ctx) => {
          console.error("[注册] 失败:", ctx.error);
          setError(ctx.error.message || "注册失败，请重试");
          turnstileRef.current?.reset();
          setTurnstileToken("");
          setLoading(false);
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
      });
    } catch (err: any) {
      setError(err.message || "Google 登录失败，请重试");
    }
  };

  const handleGithubLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/onboarding",
      });
    } catch (err: any) {
      setError(err.message || "GitHub 登录失败，请重试");
    }
  };

  return (
    <main className="flex min-h-screen bg-background font-body">
      {/* Left Side - Decorative Image */}
      <div className="relative hidden w-[45%] lg:block">
        <Image
          src="/avatars/ni_ke.jpg"
          alt="倪可"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />
        <div className="absolute bottom-12 left-12">
          <p className="font-display text-2xl text-white/90">纸片人男友</p>
          <p className="mt-2 text-sm text-white/60">有些话，可以先说给他听。</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground-muted">
            {isLogin ? "Welcome Back" : "Create Account"}
          </p>
          <h1 className="mb-8 font-display text-3xl font-semibold text-foreground">
            {isLogin ? "欢迎回来" : "创建账号"}
          </h1>

          {error && (
            <p className="mb-6 text-sm text-primary">{error}</p>
          )}
          {success && (
            <p className="mb-6 text-sm text-foreground-secondary">{success}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-foreground-secondary">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-b border-border bg-transparent px-0 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground-secondary">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border-b border-border bg-transparent px-0 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
                placeholder="至少 6 位"
              />
            </div>

            {!isLogin && (
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={isAdult}
                  onChange={(e) => setIsAdult(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground-secondary">
                  我确认已满 18 岁
                </span>
              </label>
            )}

            {!isLogin && siteKey && !isDev && (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => {
                    setError("安全验证加载失败，请刷新页面重试");
                    setTurnstileToken("");
                  }}
                  onExpire={() => setTurnstileToken("")}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-charcoal-800 py-3 text-base font-medium text-white transition-all hover:bg-charcoal-700 disabled:opacity-50"
            >
              {loading ? "处理中……" : isLogin ? "登录" : "注册"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-foreground-muted">或</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white py-3 text-sm text-foreground transition-colors hover:bg-cream-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              使用 Google 继续
            </button>
            <button
              onClick={handleGithubLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white py-3 text-sm text-foreground transition-colors hover:bg-cream-100"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              使用 GitHub 继续
            </button>
          </div>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-sm text-foreground-muted transition-colors hover:text-primary"
            >
              {isLogin ? "还没有账号？注册" : "已有账号？登录"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-foreground-muted">
            仅面向 18 岁以上用户开放
          </p>
        </div>
      </div>
    </main>
  );
}
