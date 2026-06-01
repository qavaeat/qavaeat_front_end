"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, UtensilsCrossed, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError("");
    setServerError("");
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      // _skipRefresh: true — unauthenticated route, skip token refresh logic
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
        _skipRefresh: true,
      });
      setSent(true);
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
              {sent ? "Check Your Email" : "Forgot Password?"}
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="text-sm sm:text-base text-center max-w-xs"
              style={{ color: "#858484" }}
            >
              {sent
                ? `We've sent a password reset link to ${email}. Check your inbox (and spam folder).`
                : "No worries. Enter your account email and we'll send you a reset link."}
            </motion.p>
          </div>

          {/* Body */}
          <div className="px-6 sm:px-10 pb-6 sm:pb-8">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-5 py-4"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,118,6,0.1)" }}
                  >
                    <CheckCircle2 className="w-9 h-9" style={{ color: "#007606" }} />
                  </div>
                  <p className="text-sm text-center" style={{ color: "#858484" }}>
                    The link expires in{" "}
                    <strong style={{ color: "#1a1a1a" }}>1 hour</strong>. If you
                    don&apos;t see it, check your spam folder.
                  </p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Button
                      onClick={() => { setSent(false); setEmail(""); }}
                      variant="outline"
                      className="w-full rounded-full py-5 sm:py-6 font-bold text-xs sm:text-sm tracking-widest uppercase border-border/50"
                    >
                      Send Another Link
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
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

                  <motion.div {...fadeUp(0.25)} className="flex flex-col gap-1">
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: emailError ? "#DD3131" : "#858484" }}
                      />
                      <Input
                        name="email"
                        type="email"
                        value={email}
                        onChange={handleChange}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="Email Address"
                        autoComplete="email"
                        disabled={loading}
                        className={`pl-11 pr-4 py-5 sm:py-6 rounded-full bg-background/85 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm transition-colors ${
                          emailError
                            ? "border-[#DD3131]/60 focus-visible:ring-[#DD3131]/30"
                            : "border-border/50"
                        }`}
                      />
                    </div>
                    <FieldError message={emailError} />
                  </motion.div>

                  <motion.div
                    {...fadeUp(0.3)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-1"
                  >
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-5 sm:py-6 text-xs sm:text-sm tracking-widest uppercase shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
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
            <Link
              href="/auth"
              className="flex items-center gap-1.5 text-sm font-bold hover:underline transition-opacity"
              style={{ color: "#DD3131" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}