"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";
import { useSignUp, useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ── Fade-up helper ─────────────────────────────────────
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

// ── Validation ─────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(
  mode: "signup" | "signin",
  form: { email: string; password: string },
): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (mode === "signup" && form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  } else if (mode === "signup" && !/[A-Z]/.test(form.password)) {
    errors.password = "Password must include at least one uppercase letter.";
  } else if (mode === "signup" && !/[0-9]/.test(form.password)) {
    errors.password = "Password must include at least one number.";
  }

  return errors;
}

// ── Field error message ────────────────────────────────
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

// ── Google Icon ────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ── Apple Icon ─────────────────────────────────────────
function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 flex-shrink-0 fill-foreground"
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// ── OAuth Button ───────────────────────────────────────
function OAuthButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
      <button
        onClick={onClick}
        type="button"
        className="w-full flex items-center justify-center gap-3 px-5 py-3 sm:py-3.5 rounded-full border border-border/50 bg-background/85 backdrop-blur-sm text-foreground text-sm font-bold hover:bg-background hover:border-border transition-all shadow-sm"
      >
        {icon}
        <span>{label}</span>
      </button>
    </motion.div>
  );
}

export default function AuthPage() {
  const router = useRouter();

  // Clerk hooks — used ONLY for OAuth, not manual auth
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Clear field error on change + update value
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear that field's error as user types
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
  };

  const switchMode = (next: "signup" | "signin") => {
    setMode(next);
    setFieldErrors({});
    setServerError("");
    setForm({ email: "", password: "" });
  };

  // ──────────────────────────────────────────────────────
  // MANUAL SIGN-UP → backend
  // ──────────────────────────────────────────────────────
  const handleManualSignUp = async () => {
    router.push("/select")
    // const errors = validate("signup", form);
    // if (Object.keys(errors).length > 0) {
    //   setFieldErrors(errors);
    //   return;
    // }
    // setLoading(true);
    // setServerError("");
    // try {
    //   const res = await fetch(
    //     `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    //     {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         email: form.email,
    //         password: form.password,
    //       }),
    //     }
    //   );
    //   const data = await res.json();
    //   if (!res.ok) {
    //     setServerError(data?.message ?? "Registration failed. Please try again.");
    //     return;
    //   }
    // Store token if your backend returns one:
    // localStorage.setItem("token", data.token);
    //   toast.success("Account created!", { description: "Welcome to Qavaeat." });
    //   router.replace("/");
    // } catch {
    //   setServerError("Could not connect to the server. Please try again.");
    // } finally {
    //   setLoading(false);
    // }
  };

  // ──────────────────────────────────────────────────────
  // MANUAL SIGN-IN →  backend
  // ──────────────────────────────────────────────────────
  const handleManualSignIn = async () => {
    // const errors = validate("signin", form);
    // if (Object.keys(errors).length > 0) {
    //   setFieldErrors(errors);
    //   return;
    // }

    // setLoading(true);
    // setServerError("");

    // try {
    //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       email: form.email,
    //       password: form.password,
    //     }),
    //   });

    //   const data = await res.json();

    //   if (!res.ok) {
    //     setServerError(data?.message ?? "Invalid email or password.");
    //     return;
    //   }

      // Store token:
      // localStorage.setItem("token", data.token);

    //   toast.success("Welcome back!", {
    //     description: "You have been signed in.",
    //   });
    //   router.replace("/");
    // } catch {
    //   setServerError("Could not connect to the server. Please try again.");
    // } finally {
    //   setLoading(false);
    // }
  };

  // ──────────────────────────────────────────────────────
  // CLERK OAUTH — Google / Apple only
  // ──────────────────────────────────────────────────────
  const handleOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    const client = mode === "signup" ? signUp : signIn;
    if (!client) return;
    try {
      // await client.authenticateWithRedirect({
      //   strategy,
      //   redirectUrl: "/sso-callback",
      //   redirectUrlComplete: "/",
      // });
    } catch (err) {
      console.error("OAuth error:", err);
      toast.error("OAuth sign in failed. Please try again.");
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

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
      >
        <div
          style={{
            background:
              "linear-gradient(155deg, #F4CD2E 0%, #f9e97a 30%, #fdf8e1 58%, #EBE9E9 100%)",
          }}
        >
          {/* ── Header ── */}
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
              className="text-2xl sm:text-3xl md:text-4xl font-black text-center leading-tight mb-1.5"
              style={{ color: "#1a1a1a" }}
            >
              {mode === "signup" ? (
                <>
                  Create Your <span style={{ color: "#DD3131" }}>Qavaeat</span>{" "}
                  Account
                </>
              ) : (
                <>
                  Welcome Back to{" "}
                  <span style={{ color: "#DD3131" }}>Qavaeat</span>
                </>
              )}
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="text-sm sm:text-base text-center max-w-sm"
              style={{ color: "#858484" }}
            >
              {mode === "signup"
                ? "Sign up and start discovering local chefs and healthy meals"
                : "Sign in to continue to your meal plans and chefs"}
            </motion.p>
          </div>

          {/* ── Body ── */}
          <div className="px-6 sm:px-10 pb-6 sm:pb-8">
            {/* Server / global error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium"
                  style={{
                    color: "#DD3131",
                    background: "rgba(221,49,49,0.08)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-6 md:gap-0 items-start">
              {/* ── LEFT: Manual form → backend ── */}
              <div className="flex flex-col gap-1 md:pr-8">
                {/* Email */}
                <motion.div {...fadeUp(0.25)} className="flex flex-col gap-1">
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{
                        color: fieldErrors.email ? "#DD3131" : "#858484",
                      }}
                    />
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      autoComplete="email"
                      className={`pl-11 pr-4 py-5 sm:py-6 rounded-full bg-background/85 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm transition-colors ${
                        fieldErrors.email
                          ? "border-[#DD3131]/60 focus-visible:ring-[#DD3131]/30"
                          : "border-border/50"
                      }`}
                    />
                  </div>
                  <FieldError message={fieldErrors.email} />
                </motion.div>

                {/* Password */}
                <motion.div
                  {...fadeUp(0.3)}
                  className="flex flex-col gap-1 mt-2"
                >
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{
                        color: fieldErrors.password ? "#DD3131" : "#858484",
                      }}
                    />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder={
                        mode === "signup"
                          ? "Password (min 6 chars, 1 uppercase, 1 number)"
                          : "Password"
                      }
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      className={`pl-11 pr-12 py-5 sm:py-6 rounded-full bg-background/85 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm transition-colors ${
                        fieldErrors.password
                          ? "border-[#DD3131]/60 focus-visible:ring-[#DD3131]/30"
                          : "border-border/50"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "#858484" }}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <FieldError message={fieldErrors.password} />
                </motion.div>

                {/* Password strength hint — signup only */}
                {mode === "signup" && form.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-1.5 items-center pl-2 mt-1"
                  >
                    {[
                      form.password.length >= 6,
                      /[A-Z]/.test(form.password),
                      /[0-9]/.test(form.password),
                    ].map((met, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-colors duration-300"
                        style={{
                          background: met ? "#007606" : "#EBE9E9",
                        }}
                      />
                    ))}
                    <span
                      className="text-[10px] ml-1"
                      style={{ color: "#858484" }}
                    >
                      {[
                        form.password.length >= 6,
                        /[A-Z]/.test(form.password),
                        /[0-9]/.test(form.password),
                      ].filter(Boolean).length === 3
                        ? "Strong"
                        : "Weak"}
                    </span>
                  </motion.div>
                )}

                {/* Submit */}
                <motion.div
                  {...fadeUp(0.35)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3"
                >
                  <Button
                    onClick={
                      mode === "signup"
                        ? handleManualSignUp
                        : handleManualSignIn
                    }
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-5 sm:py-6 text-xs sm:text-sm tracking-widest uppercase shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        {mode === "signup" ? "Creating..." : "Signing in..."}
                      </>
                    ) : mode === "signup" ? (
                      "Create Account"
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* ── CENTER divider ── */}
              <div
                className="hidden md:block self-stretch"
                style={{ background: "#d0cece", width: "1px" }}
              />
              <div className="flex md:hidden items-center gap-3">
                <div
                  className="flex-1 h-px"
                  style={{ background: "#d0cece" }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "#858484" }}
                >
                  OR
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "#d0cece" }}
                />
              </div>

              {/* ── RIGHT: Clerk OAuth ── */}
              <motion.div
                {...fadeUp(0.3)}
                className="flex flex-col gap-3 justify-center md:pl-8"
              >
                <p
                  className="text-xs font-semibold text-center hidden md:block"
                  style={{ color: "#858484" }}
                >
                  Or continue with
                </p>

                <OAuthButton
                  onClick={() => handleOAuth("oauth_google")}
                  icon={<GoogleIcon />}
                  label="Google"
                />

                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 h-px"
                    style={{ background: "#d0cece" }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#858484" }}
                  >
                    OR
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "#d0cece" }}
                  />
                </div>

                <OAuthButton
                  onClick={() => handleOAuth("oauth_apple")}
                  icon={<AppleIcon />}
                  label="Apple"
                />

                <p
                  className="text-[10px] text-center leading-snug mt-1"
                  style={{ color: "#858484" }}
                >
                  Social sign-in powered by Clerk
                </p>
              </motion.div>
            </div>
          </div>

          {/* ── Footer ── */}
          <motion.div
            {...fadeUp(0.5)}
            className="px-6 sm:px-10 py-5 flex flex-col items-center gap-1.5 border-t"
            style={{
              background: "rgba(235,233,233,0.6)",
              borderColor: "rgba(208,206,206,0.5)",
            }}
          >
            <p className="text-sm" style={{ color: "#858484" }}>
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("signin")}
                    className="font-bold hover:underline"
                    style={{ color: "#DD3131" }}
                  >
                    Log In
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="font-bold hover:underline"
                    style={{ color: "#DD3131" }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </p>

            <p
              className="text-xs text-center max-w-sm"
              style={{ color: "#858484" }}
            >
              By signing up, you agree to our{" "}
              <Link
                href="/terms"
                className="underline hover:opacity-80 transition-opacity"
              >
                Terms of Services
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline hover:opacity-80 transition-opacity"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
