import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Same env var your existing routes use
const BACKEND = process.env.BACKEND_API_URL ?? "http://localhost:8000";

interface ProxyOptions {
  method?: string;
  body?: string;
  qs?: string; // pre-serialised query string e.g. "foo=1&bar=2"
}

export async function proxyToBackend(
  backendPath: string,
  { method = "GET", body, qs }: ProxyOptions = {}
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const url = `${BACKEND}${backendPath}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body ? { body } : {}),
    cache: "no-store",
  });

  const text = await res.text();

  if (text.startsWith("<!")) {
    return NextResponse.json(
      { success: false, message: "Backend server error" },
      { status: 502 }
    );
  }

  if (!text.trim()) {
    return NextResponse.json({ success: true }, { status: res.status });
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid response from backend" },
      { status: 502 }
    );
  }
}