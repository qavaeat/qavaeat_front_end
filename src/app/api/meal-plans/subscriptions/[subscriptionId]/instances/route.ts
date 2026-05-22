

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

type Context = { params: Promise<{ subscriptionId: string }> };

function makeHeaders(token: string): Record<string, string> {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function GET(req: Request, ctx: Context) {
  const { subscriptionId } = await ctx.params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const backendRes = await fetch(
    `${BACKEND}/meal-plans/subscriptions/${subscriptionId}/instances?date=${date}`,
    { headers: makeHeaders(token) },
  );

  const text = await backendRes.text();
  if (text.startsWith("<!")) {
    return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 502 });
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid response from backend" }, { status: 502 });
  }
}