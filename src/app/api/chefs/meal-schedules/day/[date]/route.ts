import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/errors";

export const GET = withErrorHandler(async (_req: Request, ctx: unknown) => {
  const { date } = await (ctx as { params: Promise<{ date: string }> }).params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${process.env.BACKEND_API_URL}/meal-schedules/chef/day/${date}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });
  return NextResponse.json(JSON.parse(text), { status: res.status });
});