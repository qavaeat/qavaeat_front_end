

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;
type Context  = { params: Promise<{ itemId: string }> };

function authHeaders(token: string): Record<string, string> {
  return { "Authorization": `Bearer ${token}` };
}

export async function PATCH(_req: Request, ctx: Context) {
  const { itemId }    = await ctx.params;
  const cookieStore   = await cookies();
  const token         = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "Unauthorised" }, { status: 401 });

  const backendRes = await fetch(
    `${BACKEND}/schedules/items/${itemId}/missed`,
    { method: "PATCH", headers: authHeaders(token) },
  );
  const text = await backendRes.text();
  if (text.startsWith("<!"))
    return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 502 });
  try { return NextResponse.json(JSON.parse(text), { status: backendRes.status }); }
  catch { return NextResponse.json({ success: false, message: "Invalid response" }, { status: 502 }); }
}