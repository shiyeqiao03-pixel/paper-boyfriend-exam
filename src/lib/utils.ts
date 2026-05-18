import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dStart.getTime() === today.getTime()) {
    return "今天";
  }
  if (dStart.getTime() === yesterday.getTime()) {
    return "昨天";
  }

  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function shouldShowTimeDivider(
  current: Date | string,
  previous?: Date | string
): boolean {
  if (!previous) return false;
  const c = typeof current === "string" ? new Date(current) : current;
  const p = typeof previous === "string" ? new Date(previous) : previous;
  const diffMs = c.getTime() - p.getTime();
  return diffMs > 10 * 60 * 1000;
}
