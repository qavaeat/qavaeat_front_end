import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request, ctx: unknown) {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const res = await fetch(
      `${process.env.BACKEND_API_URL}/meal-plans/business/${id}?${qs}`,
      {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        cache: "no-store",
      },
    );
    const text = await res.text();
    if (text.startsWith("<!"))
      return NextResponse.json({ success: false, data: [], meta: null }, { status: 502 });
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: [], meta: null }, { status: 500 });
  }
}