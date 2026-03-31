
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, CreditCard, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PaymentData } from "../../types/types";

interface Props {
  data: PaymentData;
  onComplete: (data: PaymentData) => void;
}

export function Step4Payments({ data, onComplete }: Props) {
  const [form, setForm] = useState<PaymentData>(data);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isMpesa = form.method === "mpesa";

  // Validate based on selected method
  const isValid = isMpesa
    ? form.mpesaPhone.trim().length >= 9 && form.mpesaName.trim().length > 0
    : form.bankName.trim().length > 0 &&
      form.accountNumber.trim().length > 0 &&
      form.accountHolderName.trim().length > 0;

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
        {/* ── Payment method selector ── */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">
            Select Payment Destination
          </h2>

          <div className="flex flex-col gap-3">
            {/* M-Pesa option */}
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, method: "mpesa" }))}
              className={`flex items-center gap-4 w-full rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 ${
                isMpesa
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              {/* Radio */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isMpesa ? "border-primary" : "border-muted-foreground"
                }`}
              >
                {isMpesa && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>

              {/* Safaricom logo text */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold text-[#007606]">
                    Safaricom
                  </span>
                  <span className="text-[8px] text-[#DD3131] font-bold">
                    M-PESA
                  </span>
                </div>
              </div>

              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">
                  M-pesa Mobile Money
                </p>
                <p className="text-xs text-muted-foreground">
                  Instant settlement to your phone number
                </p>
              </div>

              {/* Kenya flag */}
              <span className="text-xl">🇰🇪</span>
            </button>

            {/* Bank Transfer option */}
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, method: "bank" }))}
              className={`flex items-center gap-4 w-full rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 ${
                !isMpesa
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              {/* Radio */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  !isMpesa ? "border-primary" : "border-muted-foreground"
                }`}
              >
                {!isMpesa && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>

              {/* VISA + Mastercard */}
              <div className="flex items-center gap-1">
                <span className="text-[#1A1F71] font-black text-sm italic">
                  VISA
                </span>
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
                  <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90" />
                </div>
              </div>

              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">
                  Direct Bank Transfer
                </p>
                <p className="text-xs text-muted-foreground">
                  Settlement to your domestic bank account
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Dynamic fields ── */}
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    M-pesa Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs">📱</span>
                      </div>
                    </div>
                    <Input
                      name="mpesaPhone"
                      value={form.mpesaPhone}
                      onChange={handleChange}
                      placeholder="+245 ..."
                      className="pl-11 rounded-xl border-border bg-background"
                      type="tel"
                    />
                  </div>
                </div>

                {/* Account holder name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Account holder full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="mpesaName"
                      value={form.mpesaName}
                      onChange={handleChange}
                      placeholder="As it appears on M-pesa"
                      className="pl-10 rounded-xl border-border bg-background"
                    />
                  </div>
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Bank Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                      placeholder="e.g Standard Chartered"
                      className="pl-10 rounded-xl border-border bg-background"
                    />
                  </div>
                </div>

                {/* Account number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Account Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                      placeholder="12345689"
                      className="pl-10 rounded-xl border-border bg-background"
                      type="number"
                    />
                  </div>
                </div>

                {/* Account holder name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Account holder full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="accountHolderName"
                      value={form.accountHolderName}
                      onChange={handleChange}
                      placeholder="As it appears on M-pesa"
                      className="pl-10 rounded-xl border-border bg-background"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => onComplete(form)}
              disabled={!isValid}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase rounded-full px-10 py-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
