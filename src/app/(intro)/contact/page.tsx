"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const contactDetails = [
  {
    icon: Mail,
    label: "Email Us",
    value: "hello@qavaeat.com",
    sub: "We reply within 24 hours",
    href: "mailto:hello@qavaeat.com",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+254 700 000 000",
    sub: "Mon – Fri, 8am – 6pm",
    href: "tel:+254700000000",
  },
  {
    icon: MapPin,
    label: "Find Us",
    value: "Nairobi, Kenya",
    sub: "Westlands, alongside Waiyaki Way",
    href: "https://maps.google.com",
  },
  {
    icon: Clock,
    label: "Working Hours",
    value: "Mon – Sat",
    sub: "8:00 AM – 8:00 PM EAT",
    href: null,
  },
];

const reasons = [
  { value: "general", label: "General Inquiry" },
  { value: "chef", label: "Become a Partner Chef" },
  { value: "support", label: "Meal Plan Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "other", label: "Something Else" },
];

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    toast.success("Message sent!", {
      description: "We&apos;ll get back to you within 24 hours.",
    });
    setForm({ name: "", email: "", reason: "", message: "" });
  };

  return (
    <section className="w-full bg-background min-h-screen">
      {/* ── Hero Banner ── */}
      <div className="relative w-full overflow-hidden bg-primary">
        {/* Decorative blobs — */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-primary-foreground/5" />
        <div className="absolute top-8 left-1/2 w-32 h-32 rounded-full bg-secondary/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-xs font-bold tracking-widest uppercase mb-6"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            CONTACT US
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Let&apos;s Start a{" "}
            <span className="text-secondary">Conversation</span>
          </motion.h1>

          <motion.p
            className="text-primary-foreground/80 text-base sm:text-lg max-w-xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Whether you&apos;re a food lover, a chef, or just curious —
            we&apos;re always happy to hear from you.
          </motion.p>
        </div>
      </div>

      {/* ── Contact Cards ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {contactDetails.map((item, index) => {
            const Icon = item.icon;
            const card = (
              <motion.div
                key={item.label}
                className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 group cursor-pointer"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -3 }}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.sub}
                  </p>
                </div>
              </motion.div>
            );

            return item.href ? (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="block"
              >
                {card}
              </a>
            ) : (
              <div key={item.label}>{card}</div>
            );
          })}
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left — Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Send us a message
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Fill in the form and our team will get back to you shortly.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5">
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Wambui"
                    className="rounded-xl border-border focus-visible:ring-primary bg-background text-foreground placeholder:text-muted-foreground h-11"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Email Address <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@email.com"
                    className="rounded-xl border-border focus-visible:ring-primary bg-background text-foreground placeholder:text-muted-foreground h-11"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  What&apos;s this about?
                </label>
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                >
                  <option value="" disabled>
                    Select a reason...
                  </option>
                  {reasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Your Message <span className="text-primary">*</span>
                </label>
                <Textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  className="rounded-xl border-border focus-visible:ring-primary bg-background text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>

              {/* Submit */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-sm font-semibold flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Right — Map + Socials */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Map */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-border aspect-[4/3] sm:aspect-[16/9] lg:aspect-[4/3]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.277444357687!2d36.7936!3d-1.2679!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f173c0a1f9de7%3A0x9b43c5a3c3b1b1b1!2sWestlands%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Socials */}
            <div className="rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
              <p className="text-sm font-semibold text-foreground mb-1">
                Prefer to reach us socially?
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Follow us and drop a DM — we&apos;re active on all platforms.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Instagram", href: "#" },
                  { label: "X (Twitter)", href: "#" },
                  { label: "WhatsApp", href: "#" },
                  { label: "Facebook", href: "#" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="inline-flex items-center px-4 py-2 rounded-full border border-border text-xs font-semibold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors duration-200"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
