"use client";
import { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "HOME", href: "/" },
    { label: "MENU", href: "/menu" },
    { label: "NEWS", href: "/news" },
    { label: "FAQS", href: "/faq" },
    { label: "CONTACT US", href: "/contact" },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    router.replace(href);
  };

  const handleAuthClick = () => {
    setIsOpen(false);
    router.push("/auth");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.nav
      className="sticky top-0 z-50 w-full bg-background shadow-sm border-b border-border"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20">
          {/* Logo */}
          <button onClick={() => handleNavClick("/")} className="flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/logo.png"
                alt="QavaEat Logo"
                width={130}
                height={48}
                priority
                className="h-10 sm:h-11 md:h-12 w-auto object-contain"
                style={{ width: "auto" }}
              />
            </motion.div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={`
                      relative text-xs lg:text-sm font-medium tracking-wide transition-colors pb-1
                      ${active ? "text-primary" : "text-foreground hover:text-primary"}
                    `}
                  >
                    {item.label}
                    {/* Animated underline */}
                    <motion.span
                      className="absolute bottom-0 left-0 h-[2px] bg-primary rounded-full"
                      initial={false}
                      animate={{ width: active ? "100%" : "0%" }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Button
                variant="ghost"
                className="text-foreground hover:text-primary font-medium text-sm px-4"
                onClick={handleAuthClick}
              >
                Log In
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm px-5 rounded-full"
                onClick={handleAuthClick}
              >
                Sign Up
              </Button>
            </motion.div>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="mobile-menu"
              className="md:hidden pb-5 pt-2 border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-col space-y-1">
                {navItems.map((item, index) => {
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.25 }}
                    >
                      <button
                        onClick={() => handleNavClick(item.href)}
                        className={`
                          w-full text-left flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                          ${
                            active
                              ? "text-primary bg-primary/5"
                              : "text-foreground hover:text-primary hover:bg-muted"
                          }
                        `}
                      >
                        {active && (
                          <span className="w-1 h-4 rounded-full bg-primary flex-shrink-0" />
                        )}
                        {item.label}
                      </button>
                    </motion.div>
                  );
                })}

                <motion.div
                  className="flex gap-3 px-4 pt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.25 }}
                >
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-primary text-primary hover:bg-primary/5"
                    onClick={handleAuthClick}
                  >
                    Log In
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                    onClick={handleAuthClick}
                  >
                    Sign Up
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
