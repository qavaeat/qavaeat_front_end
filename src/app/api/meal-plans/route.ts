import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res  = await fetch(`${BACKEND}/meal-plans?${qs}`, { headers, cache: "no-store" });
    const text = await res.text();
    if (text.startsWith("<!"))
      return NextResponse.json({ success: false, data: [], meta: null }, { status: 502 });
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: [], meta: null }, { status: 500 });
  }
}