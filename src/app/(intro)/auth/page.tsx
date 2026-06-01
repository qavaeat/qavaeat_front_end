"use client";

// npm install @react-oauth/google
// Add to your root layout.tsx:
//   import { GoogleOAuthProvider } from "@react-oauth/google";
//   <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
//     {children}
//   </GoogleOAuthProvider>

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast";

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function OAuthButton({
  onClick,
  icon,
  label,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <motion.div whileHover={{ scale: disabled ? 1 : 1.02 }} whileTap={{ scale: disabled ? 1 : 0.97 }}>
      <button
        onClick={onClick}
        type="button"
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-5 py-3 sm:py-3.5 rounded-full border border-border/50 bg-background/85 backdrop-blur-sm text-foreground text-sm font-bold hover:bg-background hover:border-border transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {icon}
        <span>{label}</span>
      </button>
    </motion.div>
  );
}

interface AuthResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
  user: { id: string; email: string; role: string; provider: string };
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

function resolveDestination(returnTo: string | null, role: string): string {
  if (typeof window !== "undefined") {
    const storedReturnTo = sessionStorage.getItem("returnTo");
    sessionStorage.removeItem("returnTo");
    const destination = returnTo ?? storedReturnTo;
    if (destination) return decodeURIComponent(destination);
    const lastRoute = sessionStorage.getItem("lastRoute");
    sessionStorage.removeItem("lastRoute");
    if (lastRoute && lastRoute !== "/auth") return lastRoute;
  }
  switch (role) {
    case "CHEF": return "/chef/dashboard";
    case "SUPERADMIN": return "/admin/chefs";
    default: return "/discover";
  }
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function redirectAfterLogin(role: string) {
    router.replace(resolveDestination(returnTo, role));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
  };

  const switchMode = (next: "signup" | "signin") => {
    setMode(next);
    setFieldErrors({});
    setServerError("");
    setForm({ email: "", password: "" });
  };

  // ── Email/password submit ──────────────────────────────
  const handleSubmit = async () => {
    const errors = validate(mode, form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
        _skipRefresh: true,
      });
      toastSuccess(
        mode === "signup" ? "Account created!" : "Welcome back!",
        mode === "signup" ? "Welcome to Qavaeat." : "You have been signed in.",
      );
      redirectAfterLogin(data.user.role);
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

  // ── Google OAuth — useGoogleLogin gives us an auth code flow ──
  // We use tokenResponse flow: gets an access_token we exchange for id_token
  const handleGoogleLogin = useGoogleLogin({
    // This fires with the credential (id_token) directly
    onSuccess: async (tokenResponse) => {
      setOauthLoading(true);
      setServerError("");
      try {
        // Exchange access_token for user info to get the id_token
        // Google's tokenResponse from implicit flow gives access_token.
        // We fetch userinfo to get the email, then send the credential.
        // NOTE: use credential flow via CredentialResponse for id_token directly.
        // See layout.tsx comment for the GoogleLogin button alternative.
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());

        // Send access_token + email to our proxy
        // Backend verifies via Google's tokeninfo endpoint or userinfo
        const data = await apiFetch<AuthResponse>("/auth/social", {
          method: "POST",
          body: JSON.stringify({
            googleToken: tokenResponse.access_token,
            email: userInfo.email,
          }),
          _skipRefresh: true,
        });

        toastSuccess(
          data.isNewUser ? "Account created!" : "Welcome back!",
          data.isNewUser ? "Welcome to Qavaeat." : "Signed in with Google.",
        );
        redirectAfterLogin(data.user.role);
      } catch (err) {
        setServerError(
          err instanceof ApiError
            ? err.message
            : "Google sign-in failed. Please try again.",
        );
        toastError("Sign in failed", err instanceof ApiError ? err.message : "Please try again.");
      } finally {
        setOauthLoading(false);
      }
    },
    onError: () => {
      setServerError("Google sign-in was cancelled or failed.");
      setOauthLoading(false);
    },
  });

  // ── Password strength ──────────────────────────────────
  const strengthChecks = [
    form.password.length >= 6,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
  ];
  const strengthCount = strengthChecks.filter(Boolean).length;

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center px-4 py-12 sm:py-16">
      <img
        src="/login_image.png"
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{
          position: "fixed", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center", zIndex: -2, pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)",
          zIndex: -1, pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
      >
        <div style={{ background: "linear-gradient(155deg, #F4CD2E 0%, #f9e97a 30%, #fdf8e1 58%, #EBE9E9 100%)" }}>

          {/* Header */}
          <div className="flex flex-col items-center pt-10 sm:pt-12 pb-5 px-6 sm:px-10">
            <motion.div
              {...fadeUp(0.1)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary flex items-center justify-center mb-4 shadow-md"
              style={{ background: "rgba(255,255,255,0.3)" }}
            >
              <UtensilsCrossed className="w-7 h-7 sm:w-9 sm:h-9 text-primary" />
            </motion.div>

            <motion.div
              {...fadeUp(0.12)}
              className="flex rounded-full border border-border/40 bg-background/40 backdrop-blur-sm p-1 mb-4 gap-1"
            >
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </motion.div>

            <motion.h1
              {...fadeUp(0.15)}
              className="text-2xl sm:text-3xl md:text-4xl font-black text-center leading-tight mb-1.5"
              style={{ color: "#1a1a1a" }}
            >
              {mode === "signup" ? (
                <>Create Your <span style={{ color: "#DD3131" }}>Qavaeat</span> Account</>
              ) : (
                <>Welcome Back to <span style={{ color: "#DD3131" }}>Qavaeat</span></>
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

          {/* Body */}
          <div className="px-6 sm:px-10 pb-6 sm:pb-8">
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium"
                  style={{ color: "#DD3131", background: "rgba(221,49,49,0.08)" }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-6 md:gap-0 items-start">

              {/* LEFT: Email/password form */}
              <div className="flex flex-col gap-1 md:pr-8">
                {/* Email */}
                <motion.div {...fadeUp(0.25)} className="flex flex-col gap-1">
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: fieldErrors.email ? "#DD3131" : "#858484" }}
                    />
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="Email Address"
                      autoComplete="email"
                      disabled={loading || oauthLoading}
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
                <motion.div {...fadeUp(0.3)} className="flex flex-col gap-1 mt-2">
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: fieldErrors.password ? "#DD3131" : "#858484" }}
                    />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder={mode === "signup" ? "Password (min 6 chars, 1 uppercase, 1 number)" : "Password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      disabled={loading || oauthLoading}
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
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError message={fieldErrors.password} />
                </motion.div>

                {/* Forgot password — signin only */}
                {mode === "signin" && (
                  <motion.div {...fadeUp(0.32)} className="flex justify-end pr-1 mt-0.5">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "#DD3131" }}
                    >
                      Forgot password?
                    </Link>
                  </motion.div>
                )}

                {/* Password strength — signup only */}
                <AnimatePresence>
                  {mode === "signup" && form.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-1.5 items-center pl-2 mt-1"
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

                {/* Submit */}
                <motion.div {...fadeUp(0.35)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || oauthLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-5 sm:py-6 text-xs sm:text-sm tracking-widest uppercase shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        {mode === "signup" ? "Creating..." : "Signing in..."}
                      </>
                    ) : mode === "signup" ? "Create Account" : "Sign In"}
                  </Button>
                </motion.div>
              </div>

              {/* CENTER divider */}
              <div className="hidden md:block self-stretch" style={{ background: "#d0cece", width: "1px" }} />
              <div className="flex md:hidden items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "#d0cece" }} />
                <span className="text-xs font-medium" style={{ color: "#858484" }}>OR</span>
                <div className="flex-1 h-px" style={{ background: "#d0cece" }} />
              </div>

              {/* RIGHT: Google OAuth */}
              <motion.div {...fadeUp(0.3)} className="flex flex-col gap-3 justify-center md:pl-8">
                <p className="text-xs font-semibold text-center hidden md:block" style={{ color: "#858484" }}>
                  Or continue with
                </p>

                <OAuthButton
                  onClick={() => handleGoogleLogin()}
                  icon={<GoogleIcon />}
                  label={oauthLoading ? "Redirecting..." : "Google"}
                  disabled={oauthLoading || loading}
                />

                <p className="text-[10px] text-center leading-snug mt-1" style={{ color: "#858484" }}>
                  Google sign-in — no password needed
                </p>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <motion.div
            {...fadeUp(0.5)}
            className="px-6 sm:px-10 py-5 flex flex-col items-center gap-1.5 border-t"
            style={{ background: "rgba(235,233,233,0.6)", borderColor: "rgba(208,206,206,0.5)" }}
          >
            <p className="text-sm" style={{ color: "#858484" }}>
              {mode === "signup" ? (
                <>Already have an account?{" "}
                  <button onClick={() => switchMode("signin")} className="font-bold hover:underline" style={{ color: "#DD3131" }}>Log In</button>
                </>
              ) : (
                <>Don&apos;t have an account?{" "}
                  <button onClick={() => switchMode("signup")} className="font-bold hover:underline" style={{ color: "#DD3131" }}>Sign Up</button>
                </>
              )}
            </p>
            <p className="text-xs text-center max-w-sm" style={{ color: "#858484" }}>
              By signing up, you agree to our{" "}
              <Link href="/terms" className="underline hover:opacity-80 transition-opacity">Terms of Services</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:opacity-80 transition-opacity">Privacy Policy</Link>.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}