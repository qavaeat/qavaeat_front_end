import { cookies } from "next/headers";
import { UnauthorizedError } from "@/lib/errors";

export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    throw new UnauthorizedError("No access token found. Please log in again.");
  }

  const url = `${process.env.BACKEND_API_URL}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

// ── Typed helper — parses response and throws on non-ok status ────────────────

export async function backendJson<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await backendFetch(path, options);
  const data = await res.json();
  

  if (!res.ok) {
    // Surface the Fastify error message directly to the route handler
    throw Object.assign(new Error(data?.message ?? "Backend error"), {
      status: res.status,
    });
  }

  return data as T;
}