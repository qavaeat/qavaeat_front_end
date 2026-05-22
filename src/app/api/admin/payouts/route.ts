import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
 
const BACKEND = process.env.BACKEND_API_URL!;
 
function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
 
async function getToken() {
  return (await cookies()).get("access_token")?.value;
}
 
export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "Unauthorised" }, { status: 401 });
 
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
 
  const res  = await fetch(`${BACKEND}/payouts?${qs}`, { headers: authHeaders(token) });
  const text = await res.text();
  if (text.startsWith("<!")) return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 502 });
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ success: false, message: "Invalid response" }, { status: 502 }); }
}