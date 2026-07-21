import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Set lang cookie on first visit based on browser language
  if (!request.cookies.get("lang")) {
    const acceptLang = request.headers.get("accept-language") || "";
    const lang = acceptLang.includes("zh") ? "zh" : "en";
    const response = NextResponse.next();
    response.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
