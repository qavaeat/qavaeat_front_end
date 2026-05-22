

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

async function buildHeaders(includeContentType = true): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const headers: Record<string, string> = {};
  if (includeContentType) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function GET() {
  const res = await fetch(`${BACKEND}/plans/my`, {
    headers: await buildHeaders(),
    cache: "no-store",
  });
  const text = await res.text();
  console.log("GET /plans/my response:", { status: res.status, text });
  if (text.startsWith("<!"))
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 502 },
    );
  return NextResponse.json(JSON.parse(text), { status: res.status });
}

export async function DELETE() {
  const res = await fetch(`${BACKEND}/plans/my`, {
    method: "DELETE",
    headers: await buildHeaders(false),
    cache: "no-store",
  });
  const text = await res.text();
  if (text.startsWith("<!"))
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 502 },
    );
  if (!text.trim())
    return NextResponse.json({ success: true }, { status: res.status });
  return NextResponse.json(JSON.parse(text), { status: res.status });
}
