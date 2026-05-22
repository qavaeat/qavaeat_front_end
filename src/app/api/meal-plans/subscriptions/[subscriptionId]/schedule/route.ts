

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

type Context = { params: Promise<{ subscriptionId: string }> };

export async function GET(req: Request, ctx: Context) {
  const { subscriptionId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, data: [], meta: null }, { status: 401 });
  }

  try {
    const res  = await fetch(
      `${BACKEND}/meal-plans/subscriptions/${subscriptionId}/schedule?${qs}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    const text = await res.text();
    if (text.startsWith("<!"))
      return NextResponse.json({ success: false, data: [], meta: null }, { status: 502 });
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: [], meta: null }, { status: 500 });
  }
}