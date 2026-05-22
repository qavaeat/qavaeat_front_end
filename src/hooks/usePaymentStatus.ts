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

      // Countdown — ticks every second
      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1_000);

      let elapsed = 0;

      // Poll every 3 seconds
      intervalRef.current = setInterval(async () => {
        elapsed += POLL_INTERVAL_MS;

        // Timeout check
        if (elapsed >= TIMEOUT_SECONDS * 1_000) {
          if (!resolvedRef.current) {
            resolvedRef.current = true;
            clearAll();
            setPollStatus("timeout");
            onFailed();
          }
          return;
        }

        try {
          const url = `${endpointRef.current}?apiRef=${encodeURIComponent(apiRefRef.current)}`;
          const res = await fetch(url, { credentials: "include" });
          if (!res.ok) return; // server error — keep polling

          const json: { data?: PaymentStatusResponse } | PaymentStatusResponse =
            await res.json();

          // Handle both wrapped { data: {...} } and unwrapped responses
          const data: PaymentStatusResponse =
            (json as { data?: PaymentStatusResponse }).data ??
            (json as PaymentStatusResponse);

          if (resolvedRef.current) return;

          if (data.status === "PAID") {
            resolvedRef.current = true;
            clearAll();
            setPollStatus("complete");
            onComplete();
          } else if (data.status === "FAILED") {
            resolvedRef.current = true;
            clearAll();
            setPollStatus("failed");
            onFailed();
          }
          // PENDING → keep polling
        } catch {
          // network error — keep polling silently
        }
      }, POLL_INTERVAL_MS);
    },
    [clearAll, onComplete, onFailed],
  );

  // Cleanup on unmount
  useEffect(() => () => clearAll(), [clearAll]);

  return { pollStatus, secondsLeft, startPolling, reset };
}
