

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

type Ctx = { params: Promise<{ orderId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { orderId } = await ctx.params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const body = await req.json() as { status: string };

  try {
    const res  = await fetch(`${BACKEND}/orders/${orderId}/status`, {
      method:  "PATCH",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (text.startsWith("<!")) {
      return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}