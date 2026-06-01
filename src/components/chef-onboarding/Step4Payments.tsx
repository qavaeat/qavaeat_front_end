"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, CreditCard, User, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PaymentData } from "../../types/types";

interface Props {
  data: PaymentData;
  onComplete: (data: PaymentData) => void;
}

// ── Phone normalization ────────────────────────────────
// Accepts: 07xx, 01xx, 254xx, +254xx — returns +254xxxxxxxxx or null
function normalizeKEPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^254[17]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^[17]\d{8}$/.test(digits)) return `+254${digits}`;
  return null;
}

function formatDisplay(raw: string): string {
  const n = normalizeKEPhone(raw);
  if (!n) return raw;
  return n.replace(/^\+254(\d{3})(\d{3})(\d{3})$/, "+254 $1 $2 $3");
}

// ── Field error ────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-[11px] font-medium text-destructive pl-1 mt-0.5"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ── Validation ─────────────────────────────────────────
interface FormErrors {
  mpesaPhone?: string;
  mpesaName?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

function validate(form: PaymentData): FormErrors {
  const errors: FormErrors = {};
  if (form.method === "mpesa") {
    if (!form.mpesaPhone.trim()) {
      errors.mpesaPhone = "M-Pesa phone number is required.";
    } else if (!normalizeKEPhone(form.mpesaPhone)) {
      errors.mpesaPhone =
        "Enter a valid Kenyan number (e.g. 0712 345 678 or +254712345678).";
    }
    if (!form.mpesaName.trim())
      errors.mpesaName = "Account holder name is required.";
  } else {
    if (!form.bankName.trim()) errors.bankName = "Bank name is required.";
    if (!form.accountNumber.trim())
      errors.accountNumber = "Account number is required.";
    if (!form.accountHolderName.trim())
      errors.accountHolderName = "Account holder name is required.";
  }
  return errors;
}

export function Step4Payments({ data, onComplete }: Props) {
  const [form, setForm] = useState<PaymentData>(data);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const isMpesa = form.method === "mpesa";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

  // Phone field: store raw input but show normalised hint
  const normalizedPhone = normalizeKEPhone(form.mpesaPhone);
  const phoneIsValid = !!normalizedPhone;
  const showPhoneSuccess =
    form.mpesaPhone.trim().length > 0 && phoneIsValid && !errors.mpesaPhone;

  const handleContinue = () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = document.querySelector("[data-field-error]");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Normalise phone before passing upstream
    const finalForm =
      isMpesa && normalizedPhone
        ? { ...form, mpesaPhone: normalizedPhone }
        : form;
    onComplete(finalForm);
  };

  const inputCls = (field: keyof FormErrors, extra = "") =>
    `rounded-xl border-border bg-background ${extra} ${
      errors[field]
        ? "border-destructive focus-visible:ring-destructive/30"
        : ""
    }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">
          Update how you want to get money
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          This is how and where you&apos;ll receive the daily remittance after
          customers have subscribed to you.
        </p>
      </div>

      <div className="bg-background/80 backdrop-blur-sm rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-5">

        {/* Payment method selector */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">
            Select Payment Destination
          </h2>
          <div className="flex flex-col gap-3">

            {/* M-Pesa */}
            <button
              type="button"
              onClick={() => {
                const next = { ...form, method: "mpesa" as const };
                setForm(next);
                if (submitted) setErrors(validate(next));
              }}
              className={`flex items-center gap-4 w-full rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 ${
                isMpesa
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isMpesa ? "border-primary" : "border-muted-foreground"
                }`}
              >
                {isMpesa && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-[#007606]">Safaricom</span>
                <span className="text-[8px] text-[#DD3131] font-bold">M-PESA</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">M-pesa Mobile Money</p>
                <p className="text-xs text-muted-foreground">Instant settlement to your phone number</p>
              </div>
              <span className="text-xl">🇰🇪</span>
            </button>

            {/* Bank Transfer */}
            <button
              type="button"
              onClick={() => {
                const next = { ...form, method: "bank" as const };
                setForm(next);
                if (submitted) setErrors(validate(next));
              }}
              className={`flex items-center gap-4 w-full rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 ${
                !isMpesa
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  !isMpesa ? "border-primary" : "border-muted-foreground"
                }`}
              >
                {!isMpesa && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#1A1F71] font-black text-sm italic">VISA</span>
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
                  <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">Direct Bank Transfer</p>
                <p className="text-xs text-muted-foreground">Settlement to your domestic bank account</p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic fields */}
        <AnimatePresence mode="wait">
          {isMpesa ? (
            <motion.div
              key="mpesa"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <h2 className="text-base font-bold text-foreground mb-3">
                M-pesa Account Details
              </h2>
              <div className="bg-muted/30 rounded-2xl p-4 flex flex-col gap-4">

                {/* M-Pesa phone */}
                <div
                  className="flex flex-col gap-1.5"
                  data-field-error={errors.mpesaPhone ? "" : undefined}
                >
                  <label className="text-sm font-semibold text-foreground">
                    M-Pesa Phone Number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className="text-base leading-none">🇰🇪</span>
                    </div>
                    <Input
                      name="mpesaPhone"
                      value={form.mpesaPhone}
                      onChange={handleChange}
                      placeholder="0712 345 678 or +254712345678"
                      className={inputCls("mpesaPhone", "pl-9")}
                      type="tel"
                    />
                  </div>
                  <FieldError message={errors.mpesaPhone} />
                  {/* Success hint — normalised number preview */}
                  {showPhoneSuccess && (
                    <p className="text-[11px] text-green-600 pl-1">
                      ✓ Will be saved as {formatDisplay(form.mpesaPhone)}
                    </p>
                  )}
                  {!errors.mpesaPhone && !showPhoneSuccess && (
                    <p className="text-[10px] text-muted-foreground pl-1">
                      Accepts: 07xx, 01xx, 254xx or +254xx formats
                    </p>
                  )}
                </div>

                {/* Account holder name */}
                <div
                  className="flex flex-col gap-1.5"
                  data-field-error={errors.mpesaName ? "" : undefined}
                >
                  <label className="text-sm font-semibold text-foreground">
                    Account Holder Full Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.mpesaName ? "text-destructive" : "text-muted-foreground"}`} />
                    <Input
                      name="mpesaName"
                      value={form.mpesaName}
                      onChange={handleChange}
                      placeholder="As it appears on M-Pesa"
                      className={inputCls("mpesaName", "pl-10")}
                    />
                  </div>
                  <FieldError message={errors.mpesaName} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bank"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <h2 className="text-base font-bold text-foreground mb-3">
                Bank Transfer Details
              </h2>
              <div className="bg-muted/30 rounded-2xl p-4 flex flex-col gap-4">

                {/* Bank name */}
                <div
                  className="flex flex-col gap-1.5"
                  data-field-error={errors.bankName ? "" : undefined}
                >
                  <label className="text-sm font-semibold text-foreground">
                    Bank Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.bankName ? "text-destructive" : "text-muted-foreground"}`} />
                    <Input
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                      placeholder="e.g. Standard Chartered"
                      className={inputCls("bankName", "pl-10")}
                    />
                  </div>
                  <FieldError message={errors.bankName} />
                </div>

                {/* Account number */}
                <div
                  className="flex flex-col gap-1.5"
                  data-field-error={errors.accountNumber ? "" : undefined}
                >
                  <label className="text-sm font-semibold text-foreground">
                    Account Number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.accountNumber ? "text-destructive" : "text-muted-foreground"}`} />
                    <Input
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                      placeholder="12345689"
                      className={inputCls("accountNumber", "pl-10")}
                      type="number"
                    />
                  </div>
                  <FieldError message={errors.accountNumber} />
                </div>

                {/* Account holder name */}
                <div
                  className="flex flex-col gap-1.5"
                  data-field-error={errors.accountHolderName ? "" : undefined}
                >
                  <label className="text-sm font-semibold text-foreground">
                    Account Holder Full Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.accountHolderName ? "text-destructive" : "text-muted-foreground"}`} />
                    <Input
                      name="accountHolderName"
                      value={form.accountHolderName}
                      onChange={handleChange}
                      placeholder="As it appears on your bank account"
                      className={inputCls("accountHolderName", "pl-10")}
                    />
                  </div>
                  <FieldError message={errors.accountHolderName} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleContinue}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase rounded-full px-10 py-5 text-sm"
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}