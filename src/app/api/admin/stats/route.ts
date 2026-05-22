
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const res = await fetch(
    `${process.env.BACKEND_API_URL}/admin/stats`,
    {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    }
  );

  const text = await res.text();
  if (text.startsWith("<!"))
    return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });

  return NextResponse.json(JSON.parse(text), { status: res.status });
}