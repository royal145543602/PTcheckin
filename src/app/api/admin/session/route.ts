import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, adminCookie, createAdminSession, hasAdminSession, pinMatches } from "@/lib/admin-auth";

const attempts = new Map<string, { count: number; until: number }>();
const LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  return NextResponse.json({ unlocked: await hasAdminSession(request) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!adminConfigured()) return NextResponse.json({ error: "管理员密码尚未配置" }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "请求来源无效" }, { status: 403 });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const previous = attempts.get(ip);
  if (previous && previous.until > now && previous.count >= 5) {
    return NextResponse.json({ error: "尝试次数过多，请稍后再试" }, { status: 429, headers: { "Retry-After": "900" } });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.pin !== "string" || body.pin.length > 128 || !(await pinMatches(body.pin))) {
    const count = previous && previous.until > now ? previous.count + 1 : 1;
    if (attempts.size > 10000) attempts.clear();
    attempts.set(ip, { count, until: now + LIMIT_WINDOW_MS });
    return NextResponse.json({ error: "密码错误" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  attempts.delete(ip);
  const session = await createAdminSession();
  const response = NextResponse.json({ unlocked: true, expires: session.expires });
  adminCookie(response, session.value);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
