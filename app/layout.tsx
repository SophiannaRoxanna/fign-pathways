import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, Martian_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIGN · Females in Gaming Network",
  description:
    "Pan-African federation for women and girls in gaming. Players, creators, leaders, singers, streamers, organisers — one map across every org.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning is scoped to <html> and <body> only — both are
    // common targets for browser-extension attribute injection (Grammarly,
    // 1Password, Honey, etc. tag the body with `data-…` attrs before React
    // hydrates). Without this, every page logs a hydration warning on first
    // load. Page-content mismatches are NOT suppressed; those would still
    // surface in the console.
    <html
      lang="en"
      className={`${bricolage.variable} ${manrope.variable} ${martian.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
