

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

type Context = { params: Promise<{ planId: string }> };

export async function GET(_req: Request, ctx: Context) {
  const { planId } = await ctx.params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res  = await fetch(`${BACKEND}/meal-plans/${planId}`, { headers, cache: "no-store" });
    const text = await res.text();
    if (text.startsWith("<!"))
      return NextResponse.json({ success: false, data: null }, { status: 502 });
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}