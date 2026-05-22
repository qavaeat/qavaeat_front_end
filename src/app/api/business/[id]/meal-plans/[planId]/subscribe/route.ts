import { NextResponse } from "next/server";
import { cookies }      from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

type Context = { params: Promise<{ id: string; planId: string }> };

interface SubscribeBody {
  deliveryOption:   "DELIVERY" | "PICKUP";
  startDate:        string;
  deliveryAddress?: string;
  deliveryLat?:     number;
  deliveryLng?:     number;
  phoneOverride?:   string;
}

function makeHeaders(token: string): Record<string, string> {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function POST(req: Request, ctx: Context) {
  const { planId } = await ctx.params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorised" },
      { status: 401 },
    );
  }

  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const backendRes = await fetch(`${BACKEND}/meal-plans/${planId}/subscribe`, {
    method:  "POST",
    headers: makeHeaders(token),
    body:    JSON.stringify(body),
  });

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