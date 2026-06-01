import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/chefs",
  "/faq",
  "/contact",
  "/news",
];

const PUBLIC_PREFIXES = [
  "/auth/",
  "/chefs/",
  "/faq/",
  "/contact/",
  "/news/",
  "/forgot-password/",
  "/reset-password/",
  "/sso-callback/",
  "/_next/",
  "/api/auth/",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("accessToken")?.value ??
    request.cookies.get("access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
