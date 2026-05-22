import { NextResponse } from "next/server";

// ── Cookie names ──────────────────────────────────────────────────────────────

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

// ── Token shape coming from Fastify ──────────────────────────────────────────

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// ── Set both cookies on a response ───────────────────────────────────────────

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const isProd = process.env.NODE_ENV === "production";

  // Access token — short lived, matches your Fastify ACCESS_TTL (default 900s)
  response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    httpOnly: true,               // JS cannot read this
    secure: isProd,               // HTTPS only in production
    sameSite: "strict",           // blocks CSRF
    path: "/",
    maxAge: tokens.expiresIn,     // matches the token's actual expiry (seconds)
  });

  // Refresh token — long lived, only read by /api/auth/refresh route handler
  response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth/refresh",    // scoped — browser ONLY sends this cookie to this path
    maxAge: 60 * 60 * 24 * 7,    // 7 days (matches your Fastify REFRESH_TTL)
  });
}

// ── Clear both cookies (logout / expired session) ────────────────────────────

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,  // immediately expire
  });

  response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 0,
  });
}