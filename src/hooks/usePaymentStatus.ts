import { useCallback, useEffect, useRef, useState } from "react";

export type PaymentPollStatus =
  | "idle"
  | "polling"
  | "complete"
  | "failed"
  | "timeout";

interface PaymentStatusResponse {
  status: "PENDING" | "PAID" | "FAILED";
  escrowStatus?: "HELD" | "RELEASED" | "REFUNDED" | null;
}

interface UsePaymentStatusResult {
  pollStatus: PaymentPollStatus;
  secondsLeft: number;
  startPolling: (apiRef: string, pollEndpoint?: string) => void;
  reset: () => void;
}

const POLL_INTERVAL_MS = 3_000;
const TIMEOUT_SECONDS = 90;
const DEFAULT_ENDPOINT = "/api/schedules/payment-status";

export function usePaymentStatus(
  onComplete: () => void,
  onFailed: () => void,
): UsePaymentStatusResult {
  const [pollStatus, setPollStatus] = useState<PaymentPollStatus>("idle");
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiRefRef = useRef<string>("");
  const endpointRef = useRef<string>(DEFAULT_ENDPOINT);
  const resolvedRef = useRef(false);

  // Always-fresh callbacks — avoids stale closure on onComplete/onFailed
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onFailedRef.current = onFailed; }, [onFailed]);

  const clearAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    intervalRef.current = null;
    countdownRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearAll();
    resolvedRef.current = false;
    setPollStatus("idle");
    setSecondsLeft(TIMEOUT_SECONDS);
  }, [clearAll]);

  const startPolling = useCallback(
    (apiRef: string, pollEndpoint?: string) => {
      clearAll();
      resolvedRef.current = false;
      apiRefRef.current = apiRef;
      endpointRef.current = pollEndpoint ?? DEFAULT_ENDPOINT;
      setPollStatus("polling");
      setSecondsLeft(TIMEOUT_SECONDS);

      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1_000);

      let elapsed = 0;

      intervalRef.current = setInterval(async () => {
        elapsed += POLL_INTERVAL_MS;

        if (elapsed >= TIMEOUT_SECONDS * 1_000) {
          if (!resolvedRef.current) {
            resolvedRef.current = true;
            clearAll();
            setPollStatus("timeout");
            onFailedRef.current();
          }
          return;
        }

        try {
          const url = `${endpointRef.current}?apiRef=${encodeURIComponent(
            apiRefRef.current,
          )}`;
          const res = await fetch(url, { credentials: "include" });

          // ── Visible error logging — this is what was hiding the real bug ──
          if (!res.ok) {
            console.warn(
              `[usePaymentStatus] Poll HTTP ${res.status} for apiRef=${apiRefRef.current}`,
              `→ endpoint: ${url}`,
            );
            return; // keep polling
          }

          const json: { data?: PaymentStatusResponse } | PaymentStatusResponse =
            await res.json();

          const data: PaymentStatusResponse =
            (json as { data?: PaymentStatusResponse }).data ??
            (json as PaymentStatusResponse);

          // ── Log every poll response so you can see what's coming back ──
          console.debug(
            `[usePaymentStatus] Poll response for ${apiRefRef.current}:`,
            data,
          );

          if (resolvedRef.current) return;

          if (data.status === "PAID") {
            resolvedRef.current = true;
            clearAll();
            setPollStatus("complete");
            // Small delay so the "complete" render commits before the
            // parent's onComplete can call setShowCheckout(false)
            setTimeout(() => onCompleteRef.current(), 1_800);
          } else if (data.status === "FAILED") {
            resolvedRef.current = true;
            clearAll();
            setPollStatus("failed");
            onFailedRef.current();
          }
          // PENDING → keep polling
        } catch (err) {
          console.warn("[usePaymentStatus] Poll fetch error:", err);
        }
      }, POLL_INTERVAL_MS);
    },
    [clearAll],
  );

  useEffect(() => () => clearAll(), [clearAll]);

  return { pollStatus, secondsLeft, startPolling, reset };
}