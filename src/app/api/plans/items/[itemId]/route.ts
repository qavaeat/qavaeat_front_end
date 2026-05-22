

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

export async function DELETE(
  _req: NextRequest,
  ctx: unknown
) {
  const { itemId } = await (ctx as { params: Promise<{ itemId: string }> }).params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const res = await fetch(`${BACKEND}/plans/items/${itemId}`, {
      method: "DELETE",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (text.startsWith("<!")) {
      return NextResponse.json(
        { success: false, data: null },
        { status: 502 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: true },
        { status: res.status }
      );
    }

    return NextResponse.json(JSON.parse(text), {
      status: res.status,
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null },
      { status: 500 }
    );
  }
}