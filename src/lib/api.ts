const BASE_URL = "/api";

type FetchOptions = RequestInit & {
  _isRetry?: boolean;
  _skipRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
 
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Session expiry handler ────────────────────────────────────────────────────

let sessionExpiredHandled = false; 

async function handleSessionExpired(): Promise<never> {
  if (!sessionExpiredHandled && typeof window !== "undefined") {
    sessionExpiredHandled = true;

    const returnTo = window.location.pathname + window.location.search;
    if (returnTo !== "/auth" && returnTo !== "/sign-in") {
      sessionStorage.setItem("returnTo", returnTo);
    }

    const { toastError } = await import("@/lib/toast");
    toastError("Your session has expired. Please sign in again.");
    setTimeout(() => {
      window.location.href = "/auth";
     
      sessionExpiredHandled = false;
    }, 1500);
  }

  throw new Error("Session expired.");
}

// ── Core fetch ────────────────────────────────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { _isRetry, _skipRefresh, ...fetchOptions } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
    credentials: "same-origin",
  });

  console.log(
    `[apiFetch] ${fetchOptions.method ?? "GET"} ${path} → ${response.status} | retry:${_isRetry} skipRefresh:${_skipRefresh}`,
  );

  // ── Auto-refresh on 401 ───────────────────────────────────────────────────
  if (response.status === 401 && !_isRetry && !_skipRefresh) {
    const refreshed = await tryRefresh(); // concurrent calls share one promise

    if (refreshed) {
      return apiFetch<T>(path, { ...options, _isRetry: true });
    }

    return handleSessionExpired();
  }

  // ── Guard non-JSON responses ──────────────────────────────────────────────
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      `Unexpected response from ${path} (${response.status}). The server may be down.`,
      response.status,
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data?.message ?? "Request failed", response.status);
  }

  return data as T;
}

// ── Typed error ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),

  authPost: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      _skipRefresh: true,
    }),
};
