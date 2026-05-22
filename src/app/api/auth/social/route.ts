import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { setAuthCookies } from "@/lib/cookies";
import { withErrorHandler } from "@/lib/errors";

export const POST = withErrorHandler(async (req: Request) => {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "No Clerk session found. Please sign in again." },
      { status: 401 }
    );
  }

  // Retry getUser up to 3 times — Clerk API can have transient failures
  const client = await clerkClient();
  let clerkUser;
  for (let i = 0; i < 3; i++) {
    try {
      clerkUser = await client.users.getUser(userId);
      break;
    } catch (err) {
      if (i === 2) throw err; // rethrow on last attempt
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }

  const email =
    clerkUser!.emailAddresses.find(
      (e) => e.id === clerkUser!.primaryEmailAddressId
    )?.emailAddress ?? clerkUser!.emailAddresses[0]?.emailAddress;

  if (!email) {
    return NextResponse.json(
      { success: false, message: "No email found on your account. Please try again." },
      { status: 400 }
    );
  }

  const clerkToken = await getToken();
  if (!clerkToken) {
    return NextResponse.json(
      { success: false, message: "Could not retrieve session token." },
      { status: 401 }
    );
  }

  const backendRes = await fetch(`${process.env.BACKEND_API_URL}/auth/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerkToken, email }),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(
      { success: false, message: data?.message ?? "Social authentication failed" },
      { status: backendRes.status }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: data.message,
    isNewUser: data.data.isNewUser,
    user: data.data.user,
  });

  setAuthCookies(response, data.data.tokens);
  return response;
});