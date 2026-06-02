import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiRef = searchParams.get("apiRef");

  if (!apiRef) {
    return NextResponse.json(
      { success: false, message: "apiRef is required" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorised" },
      { status: 401 },
    );
  }

  const backendRes = await fetch(
    `${BACKEND}/schedules/payment-status?apiRef=${encodeURIComponent(apiRef)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  const text = await backendRes.text();

  if (text.startsWith("<!")) {
    return NextResponse.json(
      { success: false, message: "Backend unavailable" },
      { status: 502 },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid response from backend" },
      { status: 502 },
    );
  }

  return NextResponse.json(json, { status: backendRes.status });
}