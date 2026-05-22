import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/errors";

export const POST = withErrorHandler(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  // Tell backend to invalidate the token if you have that endpoint
  if (accessToken) {
    try {
      await fetch(`${process.env.BACKEND_API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Don't block logout if backend call fails
    }
  }

  const response = NextResponse.json({ success: true });

  // Clear both cookies
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });

  return response;
});