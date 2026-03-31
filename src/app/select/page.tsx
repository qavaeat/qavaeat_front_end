"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ChefHat,
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CulinaryRevolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const leftY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const rightY = useTransform(scrollYProgress, [0, 1], [40, -80]);
  const centreY = useTransform(scrollYProgress, [0, 1], [20, -40]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-background overflow-hidden"
    >
      {/* ── Ambient background decoration ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 65%, #DD3131 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 82% 80%, #F4CD2E 0%, transparent 60%)",
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ──────────────────────────────────────────────
          MOBILE
      ────────────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col items-center px-5 pt-14 pb-14 gap-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/5 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">
              Your Path Awaits
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-foreground leading-[0.9] tracking-tight">
            Join The
          </h2>
          <h2 className="text-4xl sm:text-5xl font-black leading-[0.9] tracking-tight">
            <span className="text-primary">Culinary </span>
            <span
              style={{
                WebkitTextStroke: "2px #DD3131",
                color: "transparent",
              }}
            >
              Revolution
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-[280px] mx-auto leading-relaxed">
            Choose your path in Nairobi&apos;s most vibrant culinary ecosystem
          </p>
        </motion.div>

        {/* Centre food */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
            delay: 0.1,
            type: "spring",
            stiffness: 110,
          }}
          className="relative w-44 h-44 sm:w-52 sm:h-52"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <Image
            src="/mayai.png"
            alt="Delicious food"
            fill
            quality={90}
            className="object-contain drop-shadow-2xl relative z-10"
            sizes="208px"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="w-full max-w-sm"
        >
          <FoodieCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="w-full max-w-sm"
        >
          <ChefCard />
        </motion.div>
      </div>

      {/* ──────────────────────────────────────────────
          DESKTOP (lg+)
      ────────────────────────────────────────────── */}
      <div
        className="hidden lg:block relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ minHeight: "740px" }}
      >
        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          className="absolute top-0 left-0 right-0 flex flex-col items-center pt-14 xl:pt-16 z-20"
        >
          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/25 bg-primary/5 mb-6 backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">
              Your Path Awaits
            </span>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </motion.div>

          <h2 className="text-[3.75rem] xl:text-[4.5rem] font-black text-foreground leading-[0.88] tracking-tight">
            Join The Culinary
          </h2>

          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-[3.75rem] xl:text-[4.5rem] font-black text-primary leading-[0.88] tracking-tight">
              Revolution
            </h2>
            {/* Spinning star */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            >
              <Star className="w-7 h-7 xl:w-9 xl:h-9 text-secondary fill-secondary opacity-80" />
            </motion.div>
          </div>

          <p className="text-lg text-muted-foreground mt-4 max-w-md text-center leading-relaxed">
            Choose your path in Nairobi&apos;s most vibrant culinary ecosystem
          </p>

          {/* Decorative dots divider */}
          <div className="flex items-center gap-2.5 mt-5">
            <div className="w-14 h-px bg-gradient-to-r from-transparent to-primary/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
            <span className="w-2 h-2 rounded-full bg-secondary block" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
            <div className="w-14 h-px bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </motion.div>

        {/* ── Left image ── */}
        <motion.div
          initial={{ opacity: 0, x: -70 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute left-0 bottom-0 z-10"
          style={{ width: "38%", height: "85%", y: leftY }}
        >
          <div
            className="absolute bottom-0 left-0 w-3/4 h-2/5 blur-3xl pointer-events-none opacity-25"
            style={{
              background: "radial-gradient(ellipse, #DD3131, transparent)",
            }}
          />
          <Image
            src="/drumsticks.png"
            alt="Grilled drumsticks"
            fill
            priority
            quality={90}
            className="object-contain object-left-bottom drop-shadow-2xl"
            sizes="40vw"
          />
        </motion.div>

        {/* ── Right image ── */}
        <motion.div
          initial={{ opacity: 0, x: 70 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute right-0 bottom-0 z-10"
          style={{ width: "42%", height: "90%", y: rightY }}
        >
          <div
            className="absolute bottom-0 right-0 w-3/4 h-2/5 blur-3xl pointer-events-none opacity-20"
            style={{
              background: "radial-gradient(ellipse, #F4CD2E, transparent)",
            }}
          />
          <Image
            src="/twin_chefs.png"
            alt="Professional chefs"
            fill
            priority
            quality={90}
            className="object-contain object-right-bottom drop-shadow-2xl"
            sizes="42vw"
          />
        </motion.div>

        {/* ── Centre food ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.85,
            delay: 0.2,
            type: "spring",
            stiffness: 95,
          }}
          className="absolute z-40"
          style={{
            width: "250px",
            height: "250px",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "130px",
            y: centreY,
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110"
            animate={{ scale: [1.1, 1.25, 1.1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <Image
            src="/mayai.png"
            alt="Delicious food"
            fill
            quality={90}
            className="object-contain drop-shadow-2xl relative z-10"
            sizes="250px"
          />
        </motion.div>

        {/* ── Foodie card ── */}
        <motion.div
          initial={{ opacity: 0, y: 55, rotate: -1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
            delay: 0.32,
            type: "spring",
            stiffness: 85,
          }}
          whileHover={{ y: -10, rotate: 0.8, transition: { duration: 0.25 } }}
          className="absolute z-30"
          style={{
            left: "4%",
            bottom: "30px",
            width: "clamp(300px, 33%, 430px)",
          }}
        >
          <FoodieCard />
        </motion.div>

        {/* ── Chef card ── */}
        <motion.div
          initial={{ opacity: 0, y: 55, rotate: 1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
            delay: 0.44,
            type: "spring",
            stiffness: 85,
          }}
          whileHover={{ y: -10, rotate: -0.8, transition: { duration: 0.25 } }}
          className="absolute z-30"
          style={{
            right: "4%",
            bottom: "30px",
            width: "clamp(300px, 33%, 430px)",
          }}
        >
          <ChefCard />
        </motion.div>
      </div>
    </section>
  );
}

// ── Shared grain overlay svg ───────────────────────────
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// ── Foodie Card ────────────────────────────────────────
function FoodieCard() {
  return (
    <div
      className="relative rounded-[1.75rem] overflow-hidden shadow-2xl"
      style={{
        background:
          "linear-gradient(140deg, #B01818 0%, #DD3131 38%, #e85050 70%, #f5a8a8 100%)",
      }}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Top-left sheen */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 8% 8%, rgba(255,255,255,0.75) 0%, transparent 45%)",
        }}
      />

      {/* Bottom-right vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 95% 95%, rgba(0,0,0,0.45) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 p-6 xl:p-8 flex flex-col gap-4">
        {/* Icon chip */}
        <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>

        {/* Label + heading */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-white/55 tracking-[0.28em] uppercase">
            For Food Lovers
          </p>
          <h3 className="text-[1.9rem] xl:text-[2.15rem] font-black text-white leading-none tracking-tight">
            I&apos;M A{" "}
            <span
              style={{
                WebkitTextStroke: "2px #F4CD2E",
                color: "transparent",
              }}
            >
              FOODIE
            </span>
          </h3>
        </div>

        {/* Body */}
        <p className="text-sm xl:text-[0.9rem] text-white/82 leading-relaxed">
          Discover local chefs,{" "}
          <span className="font-black text-secondary">subscribe</span> to
          healthy meal plans and automate your nutrition effortlessly.
        </p>

        {/* Feature pills */}
        <div className="flex gap-2 flex-wrap">
          {["500+ Chefs", "Meal Plans", "Daily Delivery"].map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="mt-1"
        >
          <Link href="/discover">
            <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black text-sm tracking-wide uppercase rounded-full px-8 py-5 shadow-lg border-0 group flex items-center gap-2">
              Join as Foodie
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ── Chef Card ──────────────────────────────────────────
function ChefCard() {
  return (
    <div
      className="relative rounded-[1.75rem] overflow-hidden shadow-2xl"
      style={{
        background:
          "linear-gradient(140deg, #b88a00 0%, #F4CD2E 42%, #f9df55 72%, #fdf5bb 100%)",
      }}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Top-right sheen */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.28]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 92% 7%, rgba(255,255,255,0.85) 0%, transparent 45%)",
        }}
      />

      {/* Bottom-left warm vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 5% 92%, rgba(150,100,0,0.5) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 p-6 xl:p-8 flex flex-col gap-4">
        {/* Icon chip */}
        <div className="w-11 h-11 rounded-2xl bg-white/30 border border-white/40 backdrop-blur-sm flex items-center justify-center shadow-inner">
          <ChefHat className="w-5 h-5 text-primary" />
        </div>

        {/* Label + heading */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-foreground/45 tracking-[0.28em] uppercase">
            For Culinary Pros
          </p>
          <h3 className="text-[1.9rem] xl:text-[2.15rem] font-black text-foreground leading-none tracking-tight">
            I&apos;M A{" "}
            <span
              className="text-primary"
              style={{ WebkitTextStroke: "1px #DD3131" }}
            >
              CHEF
            </span>
          </h3>
        </div>

        {/* Body */}
        <p className="text-sm xl:text-[0.9rem] text-foreground/72 leading-relaxed">
          Manage your kitchen,{" "}
          <span className="font-black text-foreground">
            scale your business
          </span>{" "}
          and connect directly with hungry customers.
        </p>

        {/* Feature pills */}
        <div className="flex gap-2 flex-wrap">
          {["Earn Daily", "Meal Plans", "Easy Setup"].map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-3 py-1 rounded-full bg-black/[0.07] border border-black/10 text-foreground/75"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="mt-1"
        >
          <Link href="/(intro)/register">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm tracking-wide uppercase rounded-full px-8 py-5 shadow-lg border-0 group flex items-center gap-2">
              Open My Kitchen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
