

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/errors";

export const DELETE = withErrorHandler(async (_req: Request, ctx: unknown) => {
  const { id, itemId } = await (
    ctx as { params: Promise<{ id: string; itemId: string }> }
  ).params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken)
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );

  const backendRes = await fetch(
    `${process.env.BACKEND_API_URL}/meal-plans/${id}/items/${itemId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  // Backend returns 204 No Content on success — .json() would throw on empty body
  if (
    backendRes.status === 204 ||
    backendRes.headers.get("content-length") === "0"
  ) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const text = await backendRes.text();

  if (text.startsWith("<!")) {
    return NextResponse.json(
      { success: false, message: "Unexpected response from server" },
      { status: 502 },
    );
  }

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid response from server" },
      { status: 502 },
    );
  }
});
