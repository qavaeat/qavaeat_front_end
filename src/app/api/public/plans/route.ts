
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  const res = await fetch(
    `${process.env.BACKEND_API_URL}/meal-plans?${qs}`,
    { cache: "no-store" },
  );

  const text = await res.text();
  if (text.startsWith("<!"))
    return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });

  return NextResponse.json(JSON.parse(text), { status: res.status });
}