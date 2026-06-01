import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/cookies";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { googleToken, email } = body;

    if (!googleToken || !email) {
      return NextResponse.json(
        { success: false, message: "Google token and email are required" },
        { status: 400 },
      );
    }

    const backendRes = await fetch(
      `${process.env.BACKEND_API_URL}/auth/social`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleToken, email }),
      },
    );

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: data?.message ?? "Social auth failed" },
        { status: backendRes.status },
      );
    }

    // Same cookie pattern as your login route
    const response = NextResponse.json({
      success: true,
      message: data.message,
      isNewUser: data.data.isNewUser,
      user: data.data.user,
    });

    setAuthCookies(response, data.data.tokens);

    return response;
  } catch (err) {
    console.error("[social-auth]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
