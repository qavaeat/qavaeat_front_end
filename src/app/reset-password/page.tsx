"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

function validatePassword(p: string): string | undefined {
  if (!p) return "Password is required.";
  if (p.length < 6) return "Password must be at least 6 characters.";
  if (!/[A-Z]/.test(p)) return "Password must include at least one uppercase letter.";
  if (!/[0-9]/.test(p)) return "Password must include at least one number.";
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-xs font-medium pl-4 mt-1"
          style={{ color: "#DD3131" }}
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

type TokenStatus = "checking" | "valid" | "invalid";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verify token on mount — _skipRefresh since user is not authenticated
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    apiFetch<{ valid: boolean }>(`/auth/verify-reset-token?token=${token}`, {
      method: "GET",
      _skipRefresh: true,
    })
      .then((data) => setTokenStatus(data.valid ? "valid" : "invalid"))
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const strengthChecks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  const strengthCount = strengthChecks.filter(Boolean).length;

  const handleSubmit = async () => {
    const pErr = validatePassword(password);
    const cErr = password !== confirm ? "Passwords do not match." : undefined;

    if (pErr || cErr) {
      setPasswordError(pErr ?? "");
      setConfirmError(cErr ?? "");
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      // _skipRefresh: true — unauthenticated route
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        _skipRefresh: true,
      });
      setSuccess(true);
      setTimeout(() => router.replace("/auth"), 3000);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Could not connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center px-4 py-12 sm:py-16">
      <img
        src="/login_image.png"
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: -2,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.22)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div
          style={{
            background:
              "linear-gradient(155deg, #F4CD2E 0%, #f9e97a 30%, #fdf8e1 58%, #EBE9E9 100%)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center pt-10 sm:pt-12 pb-5 px-6 sm:px-10">
            <motion.div
              {...fadeUp(0.1)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary flex items-center justify-center mb-4 shadow-md"
              style={{ background: "rgba(255,255,255,0.3)" }}
            >
              <UtensilsCrossed className="w-7 h-7 sm:w-9 sm:h-9 text-primary" />
            </motion.div>

            <motion.h1
              {...fadeUp(0.15)}
              className="text-2xl sm:text-3xl font-black text-center leading-tight mb-1.5"
              style={{ color: "#1a1a1a" }}
            >
              {tokenStatus === "checking"
                ? "Verifying Link…"
                : tokenStatus === "invalid"
                ? "Link Expired"
                : success
                ? "Password Reset!"
                : "Set New Password"}
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="text-sm sm:text-base text-center max-w-xs"
              style={{ color: "#858484" }}
            >
              {tokenStatus === "checking"
                ? "Just a moment while we verify your reset link."
                : tokenStatus === "invalid"
                ? "This link is invalid or has expired. Please request a new one."
                : success
                ? "Your password has been updated. Redirecting you to sign in…"
                : "Choose a strong new password for your Qavaeat account."}
            </motion.p>
          </div>

          {/* Body */}
          <div className="px-6 sm:px-10 pb-6 sm:pb-8">
            <AnimatePresence mode="wait">
              {/* Checking */}
              {tokenStatus === "checking" && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#DD3131" }} />
                </motion.div>
              )}

              {/* Invalid */}
              {tokenStatus === "invalid" && (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-5 py-4"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(221,49,49,0.1)" }}
                  >
                    <XCircle className="w-9 h-9" style={{ color: "#DD3131" }} />
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Button
                      onClick={() => router.push("/forgot-password")}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-5 sm:py-6 text-xs sm:text-sm tracking-widest uppercase shadow-md"
                    >
                      Request New Link
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* Success */}
              {tokenStatus === "valid" && success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-5 py-4"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,118,6,0.1)" }}
                  >
                    <CheckCircle2 className="w-9 h-9" style={{ color: "#007606" }} />
                  </div>
                  <p className="text-sm text-center" style={{ color: "#858484" }}>
                    You can now sign in with your new password.
                  </p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Button
                      onClick={() => router.replace("/auth")}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-5 sm:py-6 text-xs sm:text-sm tracking-widest uppercase shadow-md"
                    >
                      Go to Sign In
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* Form */}
              {tokenStatus === "valid" && !success && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3"
                >
                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                        style={{ color: "#DD3131", background: "rgba(221,49,49,0.08)" }}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {serverError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* New password */}
                  <motion.div {...fadeUp(0.25)} className="flex flex-col gap-1">
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: passwordError ? "#DD3131" : "#858484" }}
                      />
                      <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); setServerError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="New Password"
                        autoComplete="new-password"
                        disabled={loading}
                        className={`pl-11 pr-12 py-5 sm:py-6 rounded-full bg-background/85 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm transition-colors ${
                          passwordError
                            ? "border-[#DD3131]/60 focus-visible:ring-[#DD3131]/30"
                            : "border-border/50"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "#858484" }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FieldError message={passwordError} />
                  </motion.div>

                  {/* Strength bar */}
                  <AnimatePresence>
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-1.5 items-center pl-2"
                      >
                        {strengthChecks.map((met, i) => (
                          <div
                            key={i}
                            className="flex-1 h-1 rounded-full transition-colors duration-300"
                            style={{ background: met ? "#007606" : "#EBE9E9" }}
                          />
                        ))}
                        <span className="text-[10px] ml-1" style={{ color: "#858484" }}>
                          {strengthCount === 3 ? "Strong" : "Weak"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Confirm password */}
                  <motion.div {...fadeUp(0.3)} className="flex flex-col gap-1">
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: confirmError ? "#DD3131" : "#858484" }}
                      />
                      <Input
                        name="confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setConfirmError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="Confirm New Password"
                        autoComplete="new-password"
                        disabled={loading}
                        className={`pl-11 pr-12 py-5 sm:py-6 rounded-full bg-background/85 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm transition-colors ${
                          confirmError
                            ? "border-[#DD3131]/60 focus-visible:ring-[#DD3131]/30"
                            : "border-border/50"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "#858484" }}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FieldError message={confirmError} />
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    {...fadeUp(0.35)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-2"
                  >
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-5 sm:py-6 text-xs sm:text-sm tracking-widest uppercase shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Resetting…
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div
            {...fadeUp(0.5)}
            className="px-6 sm:px-10 py-5 flex items-center justify-center border-t"
            style={{
              background: "rgba(235,233,233,0.6)",
              borderColor: "rgba(208,206,206,0.5)",
            }}
          >
            <p className="text-sm" style={{ color: "#858484" }}>
              Remembered it?{" "}
              <Link href="/auth" className="font-bold hover:underline" style={{ color: "#DD3131" }}>
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}