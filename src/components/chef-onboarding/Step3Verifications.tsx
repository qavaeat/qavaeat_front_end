"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "./FileUploadZone";
import { uploadFile } from "@/lib/supabase-upload";
import type { VerificationData } from "../../types/types";
import { toast } from "sonner";

interface Props {
  data: VerificationData;
  onComplete: (data: VerificationData) => void;
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
          className="flex items-center gap-1.5 text-[11px] font-medium text-destructive pl-1 mt-1"
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
  idFront?: string;
  idBack?: string;
  permit?: string;
}

function validate(
  form: VerificationData,
  files: { idFront: File | null; idBack: File | null; permit: File | null },
): FormErrors {
  const errors: FormErrors = {};
  if (!form.idFrontUrl && !files.idFront)
    errors.idFront = "National ID front photo is required.";
  if (!form.idBackUrl && !files.idBack)
    errors.idBack = "National ID back photo is required.";
  if (!form.businessPermitUrl && !files.permit)
    errors.permit = "Business permit document is required.";
  return errors;
}

export function Step3Verifications({ data, onComplete }: Props) {
  const [form, setForm] = useState<VerificationData>(data);
  const [files, setFiles] = useState<{
    idFront: File | null;
    idBack: File | null;
    permit: File | null;
  }>({ idFront: null, idBack: null, permit: null });
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Re-validate live after first submit
  const revalidate = (
    nextForm: VerificationData,
    nextFiles: typeof files,
  ) => {
    if (submitted) setErrors(validate(nextForm, nextFiles));
  };

  const handleContinue = async () => {
    setSubmitted(true);
    const errs = validate(form, files);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const first = document.querySelector("[data-field-error]");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setUploading(true);
    try {
      const [idFrontUrl, idBackUrl, permitUrl] = await Promise.all([
        files.idFront
          ? uploadFile("chef-documents", files.idFront, "id-front/")
          : Promise.resolve(form.idFrontUrl),
        files.idBack
          ? uploadFile("chef-documents", files.idBack, "id-back/")
          : Promise.resolve(form.idBackUrl),
        files.permit
          ? uploadFile("chef-documents", files.permit, "permit/")
          : Promise.resolve(form.businessPermitUrl),
      ]);

      onComplete({
        idFrontUrl: idFrontUrl ?? null,
        idBackUrl: idBackUrl ?? null,
        businessPermitUrl: permitUrl ?? null,
      });
    } catch {
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">
          Verify Your Business Profile
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          This is to ensure the chef is of credible business
        </p>
      </div>

      <div className="bg-background/80 backdrop-blur-sm rounded-2xl border border-border p-5 sm:p-6 shadow-sm">

        {/* National ID row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* ID Front */}
          <div
            data-field-error={errors.idFront ? "" : undefined}
            className={`rounded-xl transition-colors ${
              errors.idFront ? "ring-1 ring-destructive/40 bg-destructive/5 p-1" : ""
            }`}
          >
            <FileUploadZone
              label="Upload National ID Front Photo"
              hint="Drag photo here or browse"
              accept="image/*"
              type="image"
              value={form.idFrontUrl}
              uploading={uploading && !!files.idFront}
              onChange={(url, file) => {
                const nextForm = { ...form, idFrontUrl: url };
                const nextFiles = { ...files, idFront: file };
                setForm(nextForm);
                setFiles(nextFiles);
                revalidate(nextForm, nextFiles);
              }}
            />
            <FieldError message={errors.idFront} />
          </div>

          {/* ID Back */}
          <div
            data-field-error={errors.idBack ? "" : undefined}
            className={`rounded-xl transition-colors ${
              errors.idBack ? "ring-1 ring-destructive/40 bg-destructive/5 p-1" : ""
            }`}
          >
            <FileUploadZone
              label="Upload National ID Back Photo"
              hint="Drag photo here or browse"
              accept="image/*"
              type="image"
              value={form.idBackUrl}
              uploading={uploading && !!files.idBack}
              onChange={(url, file) => {
                const nextForm = { ...form, idBackUrl: url };
                const nextFiles = { ...files, idBack: file };
                setForm(nextForm);
                setFiles(nextFiles);
                revalidate(nextForm, nextFiles);
              }}
            />
            <FieldError message={errors.idBack} />
          </div>
        </div>

        {/* Business permit */}
        <div className="flex justify-center mb-2">
          <div
            data-field-error={errors.permit ? "" : undefined}
            className={`w-full sm:w-[calc(50%-8px)] rounded-xl transition-colors ${
              errors.permit ? "ring-1 ring-destructive/40 bg-destructive/5 p-1" : ""
            }`}
          >
            <FileUploadZone
              label="Upload Business Permit Document"
              hint="Make sure it's in pdf format"
              accept=".pdf,application/pdf"
              type="pdf"
              value={form.businessPermitUrl}
              uploading={uploading && !!files.permit}
              onChange={(url, file) => {
                const nextForm = { ...form, businessPermitUrl: url };
                const nextFiles = { ...files, permit: file };
                setForm(nextForm);
                setFiles(nextFiles);
                revalidate(nextForm, nextFiles);
              }}
            />
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Make sure it&apos;s in <span className="font-bold">pdf</span> format
            </p>
            <FieldError message={errors.permit} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleContinue}
              disabled={uploading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase rounded-full px-10 py-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}