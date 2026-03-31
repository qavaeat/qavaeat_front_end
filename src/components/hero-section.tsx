"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Star, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100svh-4rem)] sm:min-h-[calc(100svh-4.5rem)] md:min-h-[calc(100svh-5rem)] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/bg.png"
          alt=""
          fill
          priority
          quality={90}
          className="object-cover object-center -z-10"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/55 -z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[inherit]">
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4 sm:mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="text-primary">Eat Better.</span>{" "}
              <span className="text-primary">Spend Smarter.</span>
            </motion.h1>

            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-5 sm:mb-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Your Weekly Meals,{" "}
              <span className="block">Planned Perfectly.</span>
            </motion.h2>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground mb-7 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Discover curated meal plans from trusted chefs, set your weekly
              food budget and enjoy stress-free meals without overspending or
              last-minute decisions.
            </motion.p>

            <motion.div
              className="mb-7 sm:mb-9"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="relative max-w-md">
                <Input
                  placeholder="Search meals, cuisines or chefs..."
                  className="w-full pl-5 pr-14 py-5 sm:py-6 rounded-full border-2 border-border bg-background/90 backdrop-blur-sm text-sm sm:text-base shadow-sm"
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                </button>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-3 mb-8 sm:mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {[
                {
                  label: "Start Your Meal Plan",
                  className:
                    "bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-5 sm:py-6 text-sm sm:text-base font-semibold",
                  variant: undefined,
                },
                {
                  label: "Browse Your Plans",
                  className:
                    "border-2 border-primary text-primary hover:bg-primary/5 rounded-full px-6 py-5 sm:py-6 text-sm sm:text-base font-semibold",
                  variant: "outline" as const,
                },
                {
                  label: "Become Partner Chef",
                  className:
                    "bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full px-6 py-5 sm:py-6 text-sm sm:text-base font-semibold",
                  variant: undefined,
                },
              ].map(({ label, className, variant }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62 + i * 0.06, duration: 0.4 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Button variant={variant} className={className}>
                    {label}
                  </Button>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-6 sm:gap-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-secondary fill-secondary" />
                <span className="text-sm sm:text-base text-foreground font-semibold">
                  120+ Verified Chefs
                </span>
              </motion.div>
              <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <span className="text-sm sm:text-base text-foreground font-semibold">
                  100+ Meal Plans
                </span>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative hidden lg:flex items-center justify-end h-[520px] xl:h-[600px] -mr-8 xl:-mr-12"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
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

        <motion.div
          className="lg:hidden mt-10 relative w-full rounded-2xl overflow-hidden"
          style={{ aspectRatio: "4/3" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Image
            src="/home_food.png"
            alt="Curated meal plan dishes"
            fill
            quality={85}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw"
          />
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background rounded-xl shadow-lg px-4 py-2 flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            <span className="text-sm font-bold text-foreground">🔥 Keto Plan</span>
            <span className="text-sm font-bold text-foreground">KES 650</span>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              650
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}