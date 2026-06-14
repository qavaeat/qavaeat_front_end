"use client";

import { Star, UtensilsCrossed, ArrowRight, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

function PillButton({
  href,
  children,
  variant = "primary",
  icon,
  delay = 0,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "secondary";
  icon?: React.ReactNode;
  delay?: number;
}) {
  const base =
    "group relative inline-flex items-center gap-2 rounded-full font-semibold text-sm sm:text-base px-6 py-3 sm:py-3.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring";

  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25",
    outline: "border-2 border-primary text-primary hover:bg-primary/10",
    secondary:
      "bg-secondary text-secondary-foreground hover:opacity-90 shadow-lg shadow-secondary/25",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={href} className={`${base} ${variants[variant]}`}>
        {icon && (
          <span className="transition-transform duration-300 group-hover:-rotate-12">
            {icon}
          </span>
        )}
        {children}
        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
      </Link>
    </motion.div>
  );
}

function StatBadge({
  icon,
  label,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {icon}
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <>
      {/* Fixed full-viewport background — persists through scroll */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/bg.png"
          alt=""
          fill
          priority
          quality={90}
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      <section className="relative w-full min-h-[calc(100svh-4rem)] sm:min-h-[calc(100svh-4.5rem)] md:min-h-[calc(100svh-5rem)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-28 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[inherit]">
            {/* ── Left column ── */}
            <div className="flex flex-col justify-center">
              {/* Eyebrow pill */}
              <motion.div
                className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6 w-fit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-primary">
                  Weekly Meal Planning
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="text-primary">Eat Better.</span>
                <br />
                <span className="text-primary">Spend Smarter.</span>
                <br />
                <span className="text-foreground">Your Meals,</span>
                <br />
                <span className="text-foreground">Planned Perfectly.</span>
              </motion.h1>

              {/* Subheading — full foreground color */}
              <motion.p
                className="text-base sm:text-lg text-foreground font-semibold mb-9 max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.55 }}
              >
                Curated meal plans from trusted chefs. Set your weekly budget
                and enjoy stress-free, delicious meals — no last-minute
                decisions.
              </motion.p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 mb-9">
                <PillButton
                  href="/auth"
                  variant="primary"
                  icon={<UtensilsCrossed className="w-4 h-4" />}
                  delay={0.42}
                >
                  Start Your Meal Plan
                </PillButton>

                <PillButton href="/menu" variant="outline" delay={0.48}>
                  Browse Plans
                </PillButton>

                <PillButton
                  href="/register"
                  variant="secondary"
                  icon={<ChefHat className="w-4 h-4" />}
                  delay={0.54}
                >
                  Become a Chef Partner
                </PillButton>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                <StatBadge
                  icon={
                    <Star className="w-4 h-4 text-secondary fill-secondary" />
                  }
                  label="120+ Verified Chefs"
                  delay={0.65}
                />
                <StatBadge
                  icon={<UtensilsCrossed className="w-4 h-4 text-primary" />}
                  label="100+ Meal Plans"
                  delay={0.72}
                />
              </div>
            </div>

            {/* ── Right column (desktop image) ── */}
            <motion.div
              className="relative hidden lg:flex items-center justify-end h-[540px] xl:h-[620px] -mr-8 xl:-mr-12"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/home_food.png"
                  alt="Curated meal plan dishes"
                  fill
                  priority
                  quality={90}
                  className="object-contain object-right-bottom drop-shadow-2xl"
                  sizes="(max-width: 1280px) 50vw, 640px"
                />
              </div>
            </motion.div>
          </div>

          {/* ── Mobile image ── */}
          <motion.div
            className="lg:hidden mt-10 relative w-full rounded-3xl overflow-hidden shadow-xl"
            style={{ aspectRatio: "4/3" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Image
              src="/home_food.png"
              alt="Curated meal plan dishes"
              fill
              quality={85}
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw"
            />
          </motion.div>
        </div>
      </section>
    </>
  );
}
