
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const body = await req.json();

  const res = await fetch(
    `${process.env.BACKEND_API_URL}/business/${id}/suspend`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const text = await res.text();
  if (text.startsWith("<!"))
    return NextResponse.json({ success: false, message: "Server error" }, { status: 502 });

  return NextResponse.json(JSON.parse(text), { status: res.status });
}