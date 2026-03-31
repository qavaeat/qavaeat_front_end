
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, FileText, X, CheckCircle2 } from "lucide-react";

interface Props {
  label: string;
  hint?: string;
  accept?: string;
  type?: "image" | "pdf";
  value: string | null;
  onChange: (url: string | null, file: File | null) => void;
  uploading?: boolean;
}

export function FileUploadZone({
  label,
  hint = "Drag photo here or browse",
  accept = "image/*",
  type = "image",
  value,
  onChange,
  uploading = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    onChange(preview, file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none overflow-hidden
        ${dragging
          ? "border-primary bg-primary/5"
          : value
          ? "border-[#007606]/40 bg-[#007606]/5"
          : "border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5"
        }
      `}
      style={{ minHeight: "160px" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Uploading...</p>
        </div>
      ) : value ? (
        <div className="relative w-full h-full min-h-[160px]">
          {type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover rounded-2xl"
              style={{ minHeight: "160px", maxHeight: "200px" }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 gap-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <p className="text-xs font-semibold text-[#007606] text-center">
                File uploaded
              </p>
            </div>
          )}
          {/* Remove button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null, null); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {/* Done badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-[#007606] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Done
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            dragging ? "bg-primary/20" : "bg-primary/10"
          }`}>
            {type === "pdf" ? (
              <FileText className="w-7 h-7 text-primary" />
            ) : (
              <Camera className="w-7 h-7 text-primary/60" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hint.split("browse").map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <span key={i}>
                    {part}
                    <span className="text-primary font-semibold underline">browse</span>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}