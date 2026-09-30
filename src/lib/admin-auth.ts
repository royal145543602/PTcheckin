import { NextRequest, NextResponse } from "next/server";

const COOKIE = "pt_admin";
const SESSION_SECONDS = 5 * 60;

function configured() {
  const pin = process.env.ADMIN_PIN;
  const secret = process.env.ADMIN_SESSION_SECRET;
  return pin && pin.length >= 8 && secret && secret.length >= 32;
}

function bytesToBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlToBytes(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createAdminSession() {
  if (!configured()) throw new Error("Admin security is not configured");
  const expires = Date.now() + SESSION_SECONDS * 1000;
  const payload = `${expires}.${bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)))}`;
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(payload)));
  return { value: `${bytesToBase64Url(new TextEncoder().encode(payload))}.${bytesToBase64Url(signature)}`, expires };
}

export async function hasAdminSession(request: NextRequest) {
  if (!configured()) return false;
  const cookie = request.cookies.get(COOKIE)?.value;
  if (!cookie) return false;
  const parts = cookie.split(".");
  if (parts.length !== 2) return false;
  try {
    const payloadBytes = base64UrlToBytes(parts[0]);
    const payload = new TextDecoder().decode(payloadBytes);
    const expires = Number(payload.split(".")[0]);
    if (!Number.isSafeInteger(expires) || expires <= Date.now()) return false;
    return await crypto.subtle.verify("HMAC", await hmacKey(), base64UrlToBytes(parts[1]), payloadBytes);
  } catch {
    return false;
  }
}

export async function requireAdmin(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: "请先输入管理员密码" }, { status: 401 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "请求来源无效" }, { status: 403 });
  }
  return null;
}

export function adminCookie(response: NextResponse, value: string) {
  response.cookies.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    maxAge: SESSION_SECONDS,
  });
}

export async function pinMatches(input: string) {
  if (!configured()) return false;
  const encoder = new TextEncoder();
  const [actual, expected] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(input)),
    crypto.subtle.digest("SHA-256", encoder.encode(process.env.ADMIN_PIN!)),
  ]);
  const a = new Uint8Array(actual);
  const b = new Uint8Array(expected);
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a[index] ^ b[index];
  return difference === 0;
}

export function adminConfigured() {
  return Boolean(configured());
}
