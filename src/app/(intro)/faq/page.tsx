"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleHelp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const faqs = [
  {
    question: "Is Qavaeat a food delivery app?",
    answer:
      "No — Qavaeat is a meal planning platform. We connect you with trusted partner chefs who curate weekly meal plans. You browse, pick a plan, set your budget, and your meals are handled. Think of it as your personal meal planner, not a delivery app.",
  },
  {
    question: "How does payment work?",
    answer:
      "Payments are processed securely through M-Pesa or card at checkout. You pay for your selected weekly meal plan upfront, and your chef is notified immediately. No hidden charges — what you see is what you pay.",
  },
  {
    question: "What happens if I miss my meal or change my plans?",
    answer:
      "Life happens! You can reschedule or cancel a meal up to 12 hours before it's due. Head to your dashboard, find the meal, and make changes from there. Repeated cancellations may affect your plan subscription.",
  },
  {
    question: "Who prepares the meals?",
    answer:
      "All meals are prepared by our verified partner chefs — real culinary professionals who have passed our vetting process. Each chef profile shows their certifications, ratings, and specialties so you know exactly who's cooking for you.",
  },
  {
    question: "Can I choose what I eat?",
    answer:
      "Absolutely. When browsing meal plans, you can filter by cuisine, dietary preference (vegan, keto, halal, etc.), and budget. Some chefs also offer fully customizable plans where you can swap individual meals to your liking.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="w-full bg-background py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-5 sm:mb-6"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center px-5 py-2 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-bold tracking-widest uppercase">
            FAQs
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-center mb-10 sm:mb-12 md:mb-14 leading-tight"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          Questions People Ask{" "}
          <span className="block sm:inline">Before Joining</span>
        </motion.h2>

        {/* FAQ List */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => handleToggle(index)}
                >
                  <div
                    className={`rounded-2xl border bg-background transition-all duration-300 px-4 sm:px-6 ${
                      isOpen
                        ? "border-primary/30 bg-primary/[0.03] shadow-sm"
                        : "border-border hover:border-primary/20"
                    }`}
                  >
                    <CollapsibleTrigger className="flex w-full items-center gap-3 sm:gap-4 py-4 sm:py-5 cursor-pointer">
                      <CircleHelp
                        className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-colors duration-300 ${
                          isOpen ? "text-primary" : "text-primary/60"
                        }`}
                      />
                      <span
                        className={`flex-1 text-left text-sm sm:text-base font-medium transition-colors duration-300 ${
                          isOpen ? "text-foreground" : "text-foreground/80"
                        }`}
                      >
                        {faq.question}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </motion.span>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.p
                            key="content"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="pl-8 sm:pl-10 pb-4 sm:pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed"
                          >
                            {faq.answer}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="flex justify-center mt-10 sm:mt-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              className="rounded-full border-2 border-primary text-primary hover:bg-primary/5 px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold"
            >
              See All FAQs
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
