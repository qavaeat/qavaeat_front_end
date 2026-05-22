// src/components/ui/ConfirmDeleteDialog.tsx
//
// Usage:
//   <ConfirmDeleteDialog
//     open={showDelete}
//     title="Delete Menu Item"
//     description="This will permanently remove this item. This action cannot be undone."
//     itemName="Grilled Chicken Nuggets"
//     onConfirm={handleDelete}
//     onCancel={() => setShowDelete(false)}
//     loading={deleting}
//   />

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  title = "Delete Item",
  description = "This action cannot be undone.",
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
          {/* backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* sheet / dialog */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <div className="p-6 space-y-4">
              {/* icon */}
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>

              {/* text */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-foreground">{title}</h3>
                {itemName && (
                  <p className="text-xs font-semibold text-foreground/70 bg-muted px-3 py-1.5 rounded-lg inline-block">
                    &quot;{itemName}&quot;
                  </p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* actions */}
            <div className="flex gap-2 px-6 pb-6">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-xl border-border text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-sm font-bold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}