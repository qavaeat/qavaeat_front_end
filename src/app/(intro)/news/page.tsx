"use client";
import { motion } from "framer-motion";
import { HardHat } from "lucide-react";

export default function ComingSoon({
  featureName = "This Feature",
  description = "We're working hard to bring this to you. Check back soon.",
}: {
  featureName?: string;
  description?: string;
}) {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-16">

      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, color-mix(in srgb, var(--primary) 7%, transparent), transparent 70%)",
        }}
      />

      {/* Corner lines — top left */}
      <svg aria-hidden="true" className="absolute top-0 left-0 w-36 sm:w-52 opacity-[0.07] text-primary" viewBox="0 0 200 200" fill="none">
        <line x1="0" y1="0" x2="200" y2="200" stroke="currentColor" strokeWidth="1.2" />
        <line x1="50" y1="0" x2="200" y2="150" stroke="currentColor" strokeWidth="1.2" />
        <line x1="100" y1="0" x2="200" y2="100" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      {/* Corner lines — bottom right */}
      <svg aria-hidden="true" className="absolute bottom-0 right-0 w-36 sm:w-52 opacity-[0.07] text-secondary rotate-180" viewBox="0 0 200 200" fill="none">
        <line x1="0" y1="0" x2="200" y2="200" stroke="currentColor" strokeWidth="1.2" />
        <line x1="50" y1="0" x2="200" y2="150" stroke="currentColor" strokeWidth="1.2" />
        <line x1="100" y1="0" x2="200" y2="100" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md">

        {/* Top accent bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
          className="h-1 w-14 sm:w-16 rounded-full bg-primary mb-8"
        />

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-7 sm:mb-8 shadow-sm"
        >
          <HardHat className="w-9 h-9 sm:w-11 sm:h-11 text-primary" strokeWidth={1.8} />
        </motion.div>

        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-secondary/40 bg-secondary/10 text-secondary-foreground text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          Under Construction
        </motion.span>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight mb-4"
        >
          {featureName}{" "}
          <span className="text-primary">is coming</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
          className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8"
        >
          {description}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="h-px w-20 bg-border mb-8"
        />

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
          className="text-[10px] sm:text-xs text-muted-foreground/50 tracking-widest uppercase font-semibold"
        >
          Good things take time
        </motion.p>
      </div>
    </div>
  );
}