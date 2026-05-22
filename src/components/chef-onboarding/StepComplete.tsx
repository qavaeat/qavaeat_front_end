
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Timer, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  chefName: string;
}

export function StepComplete({ chefName }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">
          Congratulations, Chef <span className="text-primary">{chefName}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Your onboarding is complete! Sit tight while we review your profile.
        </p>
      </div>

      {/* Card */}
      <div className="bg-background/80 backdrop-blur-sm rounded-2xl border border-border p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        {/* Pending status */}
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0 flex items-center justify-center shadow-md"
            style={{
              background: "linear-gradient(135deg, #F4CD2E 0%, #8E771B 100%)",
            }}
          >
            <Timer className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground mb-1.5">
              Pending Approval from Admin
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;re reviewing your application to ensure everything is good
              to go. This usually takes 1 business day to review. You&apos;ll
              receive a call and confirmation email once your account has been
              verified and live on Qavaeat.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* What's next */}
        <div>
          <h3 className="text-base font-black text-foreground mb-3">
            What&apos;s Next?
          </h3>

          <div className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-black">Review:</span> Your details are
                being reviewed by our team.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-secondary-foreground" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-black">Activation:</span> Once verified,
                your kitchen will go live on Qavaeat
              </p>
            </motion.div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/menu">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase rounded-full px-10 py-5 text-sm shadow-md">
                Browse as Customer
              </Button>
            </Link>
          </motion.div>

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Explore kitchens, browse menus and get inspired while you wait.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
