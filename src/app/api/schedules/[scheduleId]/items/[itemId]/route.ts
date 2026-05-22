

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; itemId: string }> }
) {
  const { scheduleId, itemId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND}/schedules/${scheduleId}/items/${itemId}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });
  if (!text.trim()) return NextResponse.json({ success: true }, { status: res.status });
  return NextResponse.json(JSON.parse(text), { status: res.status });
}