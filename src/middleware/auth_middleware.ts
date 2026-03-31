// ─────────────────────────────────────────────
// src/middleware.ts
// ─────────────────────────────────────────────
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth(.*)",
  "/sso-callback(.*)",
  "/chefs(.*)",
  "/faq(.*)",
  "/contact(.*)",
  "/news(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};


// ─────────────────────────────────────────────
// .env.local — add these variables
// ─────────────────────────────────────────────
//
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
// CLERK_SECRET_KEY=sk_...
//
// NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
// NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth
// NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
// NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/