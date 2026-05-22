import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

// ── Error toast ───────────────────────────────────────────────────────────────

export function toastError(
  errorOrMessage: unknown,
  fallback = "Something went wrong. Please try again."
) {
  let message = fallback;

  if (typeof errorOrMessage === "string" && errorOrMessage.trim()) {
    message = errorOrMessage;
  } else if (errorOrMessage instanceof ApiError) {
    message = errorOrMessage.message;
  } else if (errorOrMessage instanceof Error) {
    message = errorOrMessage.message;
  }

  toast.error(message, {
    duration: 5000,
    style: {
      background: "rgba(221,49,49,0.08)",
      border: "1px solid rgba(221,49,49,0.25)",
      color: "#DD3131",
    },
  });
}

// ── Success toast ─────────────────────────────────────────────────────────────

export function toastSuccess(title: string, description?: string) {
  toast.success(title, {
    description,
    duration: 4000,
    style: {
      background: "rgba(0,118,6,0.07)",
      border: "1px solid rgba(0,118,6,0.2)",
      color: "#007606",
    },
  });
}

// ── Info toast (optional but useful) ─────────────────────────────────────────

export function toastInfo(title: string, description?: string) {
  toast.info(title, {
    description,
    duration: 4000,
  });
}