import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;
  return session.user;
}

export async function requireAuth(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: "未登录", status: 401 } as const;
  }
  return { user } as const;
}
