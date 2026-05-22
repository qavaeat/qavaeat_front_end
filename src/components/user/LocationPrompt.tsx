"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocationStatus } from "@/hooks/useLocation";

interface Props {
  open: boolean;
  status: LocationStatus;
  onAllow: () => void;
  onDecline: () => void;
}

export function LocationPrompt({ open, status, onAllow, onDecline }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="bg-background rounded-3xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
              {/* Top visual */}
              <div className="relative h-40 bg-gradient-to-br from-primary/20 via-secondary/10 to-[#007606]/10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #DD3131 0%, transparent 50%), radial-gradient(circle at 70% 60%, #F4CD2E 0%, transparent 50%)" }} />
                {/* Ripple rings */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border-2 border-primary/30"
                    initial={{ width: 40, height: 40, opacity: 0.8 }}
                    animate={{ width: 40 + i * 60, height: 40 + i * 60, opacity: 0 }}
                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: "easeOut" }}
                  />
                ))}
                <div className="relative w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-center space-y-1.5">
                  <h2 className="text-lg font-black text-foreground">
                    Find Kitchens Near You
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Allow location access to discover nearby chefs, see distances, and get relevant results first.
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  {[
                    { icon: Navigation, text: "See kitchens sorted by distance" },
                    { icon: MapPin, text: "Accurate delivery time estimates" },
                    { icon: Globe, text: "Discover hidden local gems nearby" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    onClick={onAllow}
                    disabled={status === "requesting"}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-black h-12 text-sm"
                  >
                    {status === "requesting" ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Getting location...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Use My Location
                      </span>
                    )}
                  </Button>
                  <button
                    onClick={onDecline}
                    className="w-full text-xs text-muted-foreground hover:text-foreground py-2 font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Skip for now — show all kitchens
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Your location is only used to find nearby kitchens and is never shared with third parties.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}