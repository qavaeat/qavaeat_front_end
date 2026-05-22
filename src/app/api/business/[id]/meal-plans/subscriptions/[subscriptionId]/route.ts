

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

type Context = { params: Promise<{ subscriptionId: string }> };

export async function DELETE(req: Request, ctx: Context) {
  const { subscriptionId } = await ctx.params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* no body is fine */ }

  try {
    const res  = await fetch(`${BACKEND}/meal-plans/subscriptions/${subscriptionId}`, {
      method:  "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify(body),
    });
    const text = await res.text();
    if (text.startsWith("<!"))
      return NextResponse.json({ success: false, message: "Backend error" }, { status: 502 });
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: "Request failed" }, { status: 500 });
  }
}