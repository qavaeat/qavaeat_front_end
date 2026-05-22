

import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();

  // Basic presence check before hitting the backend
  const required = [
    "email", "name", "phone", "address", "city", "state", "country",
    "nationalIdFrontUrl", "nationalIdBackUrl", "businessPermitUrl",
  ];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return NextResponse.json(
      { success: false, message: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  // Forward to Fastify POST /business — no auth header, public route
  const backendRes = await fetch(`${process.env.BACKEND_API_URL}/business`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(
      { success: false, message: data?.message ?? "Submission failed" },
      { status: backendRes.status },
    );
  }

  return NextResponse.json({
    success: true,
    message: data.message,
    data: data.data,
  });
});