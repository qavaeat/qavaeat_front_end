
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString(); // preserves ?date=YYYY-MM-DD

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });

  try {
    const res  = await fetch(`${BACKEND}/dashboard${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache:   "no-store",
    });
    const text = await res.text();
    if (text.startsWith("<!"))
      return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 502 });
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}