import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
 
const BACKEND = process.env.BACKEND_API_URL!;
 
export async function GET(req: Request) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "Unauthorised" }, { status: 401 });
 
  const qs  = new URL(req.url).searchParams.toString();
  const res = await fetch(`${BACKEND}/admin/disputes/missed${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache:   "no-store",
  });
  const text = await res.text();
  if (text.startsWith("<!"))
    return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 502 });
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ success: false, message: "Invalid response" }, { status: 502 }); }
}