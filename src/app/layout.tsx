import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RouteTracker } from "@/components/RouteTracker";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { FetchInterceptor } from "@/components/FetchInterceptor";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "QavaEat — Eat Better, Spend Smarter",
    template: "%s | QavaEat",
  },
  description:
    "Discover curated meal plans from trusted chefs. Set your weekly budget and enjoy stress-free meals without overspending.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QavaEat",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#DD3131",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geist.className}`}
      >
        <body className="font-sans antialiased bg-background text-foreground">
          <ThemeProvider>
            <FetchInterceptor />
            <Toaster position="top-right" richColors />
            <RouteTracker />
            {children}
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}