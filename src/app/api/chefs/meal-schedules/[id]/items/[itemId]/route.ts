import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/errors";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export const PATCH = withErrorHandler(async (req: Request, ctx: unknown) => {
  const { id, itemId } = await (ctx as { params: Promise<{ id: string; itemId: string }> }).params;
  const accessToken = await getToken();
  if (!accessToken) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${process.env.BACKEND_API_URL}/meal-schedules/${id}/items/${itemId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });
  return NextResponse.json(JSON.parse(text), { status: res.status });
});

export const DELETE = withErrorHandler(async (_req: Request, ctx: unknown) => {
  const { id, itemId } = await (ctx as { params: Promise<{ id: string; itemId: string }> }).params;
  const accessToken = await getToken();
  if (!accessToken) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${process.env.BACKEND_API_URL}/meal-schedules/${id}/items/${itemId}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return NextResponse.json({ success: true }, { status: 200 });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });
  return NextResponse.json(JSON.parse(text), { status: res.status });
});