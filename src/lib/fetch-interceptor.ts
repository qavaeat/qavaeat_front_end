

const BASE_URL = "/api";

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await window._originalFetch("/api/auth/refresh", {
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

let sessionExpiredHandled = false;

function handleSessionExpired() {
  if (!sessionExpiredHandled) {
    sessionExpiredHandled = true;
    const returnTo = window.location.pathname + window.location.search;
    if (returnTo !== "/auth" && returnTo !== "/sign-in") {
      sessionStorage.setItem("returnTo", returnTo);
    }
    setTimeout(() => {
      window.location.href = "/auth";
      sessionExpiredHandled = false;
    }, 1500);
  }
}

export function installFetchInterceptor() {
  if (window._originalFetch) return;

  // Keep a reference to the original fetch
  window._originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    // Normalize the URL
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    // Only intercept calls to our own API
    const isApiCall =
      url.startsWith("/api") || url.startsWith(window.location.origin + "/api");

    // Never intercept the refresh endpoint itself — avoid infinite loop
    const isRefreshCall = url.includes("/api/auth/refresh");

    // Never intercept auth endpoints — wrong password returns 401 and should
    // show an error, not trigger a refresh
    const isAuthCall = url.includes("/api/auth");

    if (!isApiCall || isRefreshCall || isAuthCall) {
      return window._originalFetch(input, init);
    }

    const response = await window._originalFetch(input, init);

    if (response.status === 401) {
      const refreshed = await tryRefresh();

      if (refreshed) {
        // Retry the original request
        return window._originalFetch(input, init);
      }

      handleSessionExpired();
    }

    return response;
  };
}

// Extend window type
declare global {
  interface Window {
    _originalFetch: typeof fetch;
  }
}
