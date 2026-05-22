import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/cookies";
import { withErrorHandler } from "@/lib/errors";


export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required" },
      { status: 400 }
    );
  }

  const backendRes = await fetch(`${process.env.BACKEND_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }), // ← must be stringified
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(
      { success: false, message: data?.message ?? "Authentication failed" },
      { status: backendRes.status }
    );
  }

  // Build response then attach httpOnly cookies
  const response = NextResponse.json({
    success: true,
    message: data.message,
    isNewUser: data.data.isNewUser,
    user: data.data.user,
  });

  setAuthCookies(response, data.data.tokens);

  return response;
});