import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/errors";

export const GET = withErrorHandler(async (req: Request) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  const res = await fetch(`${process.env.BACKEND_API_URL}/meal-schedules/chef/incoming?${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });
  return NextResponse.json(JSON.parse(text), { status: res.status });
});

export const POST = withErrorHandler(async (req: Request) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${process.env.BACKEND_API_URL}/meal-schedules`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });
  return NextResponse.json(JSON.parse(text), { status: res.status });
});