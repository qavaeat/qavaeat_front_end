import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/errors";

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  const backendRes = await fetch(`${process.env.BACKEND_API_URL}/menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
});

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken)
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );

  const qs = searchParams.toString();
  const backendRes = await fetch(
    `${process.env.BACKEND_API_URL}/menu/mine?${qs}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
});
