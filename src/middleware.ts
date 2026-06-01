// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = (pathname: string) =>
  [
    "/discover",
    "/chef",
    "/admin",
    "/orders",
    "/profile",
    "/cart",
    "/meal-plans",
  ].some((route) => pathname.startsWith(route));

export default function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    const returnTo = encodeURIComponent(pathname + search);
    return NextResponse.redirect(
      new URL(`/auth?returnTo=${returnTo}`, request.url),
    );
  }

  try {
    const [, payloadB64] = accessToken.split(".");
    const json = Buffer.from(payloadB64, "base64").toString("utf-8");
    const payload = JSON.parse(json);
    const role = (payload.role as string) ?? "USER";
    const isExpired =
      payload.exp && payload.exp < Math.floor(Date.now() / 1000);

    // Expired — let through, api.ts auto-refreshes on the first 401
    if (isExpired) return NextResponse.next();

    // Role protection
    if (
      pathname.startsWith("/chef") &&
      role !== "CHEF" &&
      role !== "SUPERADMIN"
    ) {
      return NextResponse.redirect(new URL("/discover", request.url));
    }
    if (pathname.startsWith("/admin") && role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/discover", request.url));
    }

    return NextResponse.next();
  } catch {
    // Malformed token — clear cookies and redirect to login
    const returnTo = encodeURIComponent(pathname + search);
    const res = NextResponse.redirect(
      new URL(`/auth?returnTo=${returnTo}`, request.url),
    );
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};