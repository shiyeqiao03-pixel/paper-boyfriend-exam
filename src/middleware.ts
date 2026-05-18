import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 开发阶段：临时禁用认证检查，允许直接访问所有页面
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
