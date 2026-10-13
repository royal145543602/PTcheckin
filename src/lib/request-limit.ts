import { NextRequest } from "next/server";
import { getDb } from "./db";

// Shared database counters work across Cloudflare Worker instances.
export async function allowRequest(request: NextRequest, scope: string, limit: number, seconds: number) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${scope}:${ip}`));
  const key = Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2,"0")).join("");
  const { data, error } = await getDb().rpc("roster_allow_request", { request_key: key, request_limit: limit, window_seconds: seconds });
  if (error) throw new Error("暫時無法處理請求，請稍後再試。");
  return data === true;
}
