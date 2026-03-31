
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "./FileUploadZone";
import { uploadFile } from "@/lib/supabase-upload";
import type { VerificationData } from "../../types/types";
import { toast } from "sonner";

interface Props {
  data: VerificationData;
  onComplete: (data: VerificationData) => void;
}

export function Step3Verifications({ data, onComplete }: Props) {
  const [form, setForm] = useState<VerificationData>(data);
  const [files, setFiles] = useState<{
    idFront: File | null;
    idBack: File | null;
    permit: File | null;
  }>({ idFront: null, idBack: null, permit: null });
  const [uploading, setUploading] = useState(false);

  // All three documents required
  const isValid =
    (form.idFrontUrl !== null || files.idFront !== null) &&
    (form.idBackUrl !== null || files.idBack !== null) &&
    (form.businessPermitUrl !== null || files.permit !== null);

  const handleContinue = async () => {
    if (!isValid) return;
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
          <FileUploadZone
            label="Upload National ID Front Photo"
            hint="Drag photo here or browse"
            accept="image/*"
            type="image"
            value={form.idFrontUrl}
            uploading={uploading && !!files.idFront}
            onChange={(url, file) => {
              setForm((p) => ({ ...p, idFrontUrl: url }));
              setFiles((p) => ({ ...p, idFront: file }));
            }}
          />

          <FileUploadZone
            label="Upload National ID Back Photo"
            hint="Drag photo here or browse"
            accept="image/*"
            type="image"
            value={form.idBackUrl}
            uploading={uploading && !!files.idBack}
            onChange={(url, file) => {
              setForm((p) => ({ ...p, idBackUrl: url }));
              setFiles((p) => ({ ...p, idBack: file }));
            }}
          />
        </div>

        {/* Business permit — centred */}
        <div className="flex justify-center mb-2">
          <div className="w-full sm:w-[calc(50%-8px)]">
            <FileUploadZone
              label="Upload Business Permit Document"
              hint={`Make sure it's in pdf format`}
              accept=".pdf,application/pdf"
              type="pdf"
              value={form.businessPermitUrl}
              uploading={uploading && !!files.permit}
              onChange={(url, file) => {
                setForm((p) => ({ ...p, businessPermitUrl: url }));
                setFiles((p) => ({ ...p, permit: file }));
              }}
            />
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Make sure it&apos;s in <span className="font-bold">pdf</span>{" "}
              format
            </p>
          </div>
        </div>

        {/* Required indicator */}
        {!isValid && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            All three documents are required to continue
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleContinue}
              disabled={!isValid || uploading}
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
