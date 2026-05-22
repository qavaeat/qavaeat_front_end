

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

async function buildHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function GET(): Promise<NextResponse> {
  const res = await fetch(`${BACKEND}/profile/me`, {
    headers: await buildHeaders(),
    cache: "no-store",
  });

  const text = await res.text();

  // Guard against HTML error pages from the backend
  if (text.trimStart().startsWith("<")) {
    return NextResponse.json(
      { success: false, message: "Backend server error" },
      { status: 502 },
    );
  }

  const json = JSON.parse(text) as unknown;
  return NextResponse.json(json, { status: res.status });
}
