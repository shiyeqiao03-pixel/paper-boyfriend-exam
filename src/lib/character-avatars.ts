export const AVATAR_MAP: Record<string, string> = {
  "陆沉舟": "/avatars/luchenzhou.jpg",
  "倪可": "/avatars/ni_ke.jpg",
  "许知衡": "/avatars/xuzhiheng.jpg",
  "周野": "/avatars/zhouye.jpg",
};

export function getAvatarUrl(name: string): string {
  return AVATAR_MAP[name] || "";
}
