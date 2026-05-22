
import { NextResponse } from "next/server";
import { cookies }      from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;
type Ctx = { params: Promise<{ businessId: string }> };

async function getToken() {
  return (await cookies()).get("access_token")?.value;
}
function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function POST(req: Request, ctx: Ctx) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "Unauthorised" }, { status: 401 });

  const { businessId } = await ctx.params;
  const body = await req.json() as unknown;

  const res  = await fetch(`${BACKEND}/payouts/${businessId}/remit`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify(body),
  });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 502 });
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ success: false, message: "Invalid response" }, { status: 502 }); }
}