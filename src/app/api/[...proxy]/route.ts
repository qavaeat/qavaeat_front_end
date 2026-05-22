import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "@/lib/cookies";

const FASTIFY_URL = process.env.BACKEND_API_URL;

async function handler(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  // Strip the /api prefix before forwarding to Fastify
  const targetPath = request.nextUrl.pathname.replace(/^\/api/, "");
  const targetUrl = `${FASTIFY_URL}${targetPath}${request.nextUrl.search}`;

  if (targetPath.startsWith("/auth")) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Don't forward Next.js internal headers
  headers.delete("host");
  headers.delete("cookie");

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
