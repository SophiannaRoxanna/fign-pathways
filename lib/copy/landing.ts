import { C } from "@/lib/design/tokens";

export type DoorKey = "woman" | "org" | "partner";

export type Door = {
  key: DoorKey;
  number: string;
  kicker: string;
  headline: string;
  lede: string;
  bullets: string[];
  cta: string;
  subcta: string;
  color: string;
  href: string;
};

export const DOORS: Door[] = [
  {
    key: "woman",
    number: "I",
    kicker: "for a woman finding her way",
    headline: "I want to find my shape in gaming.",
    lede: "Whether you sing, compete, cosplay, stream, code, draw, write, or you're still figuring it out — FIGN connects you to the orgs, events, and women already doing it across Africa.",
    bullets: [
      "Pick interests · no forced career path",
      "See events from FIGN, Femmes aux Consoles, Bambina, Nexal, and others — in one place",
      "Find a mentor, a squad, a first gig, a scholarship",
      "Your growth tracked across every org you join",
    ],
    cta: "Start exploring",
    subcta: "2 min · pick a few tags · no profile needed yet",
    color: C.coral,
    href: "/signin",
  },
  {
    key: "org",
    number: "II",
    kicker: "for a women-in-gaming organization",
    headline: "I run an org. FIGN should amplify us, not absorb us.",
    lede: "You keep your brand, your programs, your members. FIGN gives you pan-African reach, a shared talent pool, and tools to run events without rebuilding them from scratch. Femmes aux Consoles and Bambina already operate this way.",
    bullets: [
      "Your page · your branding · your members",
      "Post events to the FIGN network · get qualified signups",
      "Shared toolkit: registrations, attendance, recap pages",
      "Your work counts toward FIGN-wide impact (and your own)",
    ],
    cta: "Join the network",
    subcta: "Free · reviewed by Sophia · onboarded in under a week",
    color: C.purple,
    href: "mailto:sophia@fign.org?subject=FIGN%20Member%20Org%20Inquiry",
  },
  {
    key: "partner",
    number: "III",
    kicker: "for a studio · event · sponsor",
    headline: "I need qualified African women in gaming.",
    lede: "Studios hiring, tournaments filling slots, scholarships looking for recipients, sponsors funding impact. FIGN is a reach channel to an engaged, filtered audience across 7+ countries — Nexal, Juju Games, Garden City Esports, Daimyo Arena, Phygital Nigeria already work this way.",
    bullets: [
      "Post a tournament, gig, role, or scholarship",
      "Filter by country, interest, experience level",
      "Live impact page showing your attribution",
      "No transaction fees · no paywall for members",
    ],
    cta: "Open a partner account",
    subcta: "Quick call with Sophia · tier assigned based on fit",
    color: C.blue,
    href: "mailto:sophia@fign.org?subject=FIGN%20Partner%20Inquiry",
  },
];

export const EVIDENCE: { num: string; label: string }[] = [
  { num: "7+",  label: "Countries live" },
  { num: "12",  label: "Partners + member orgs" },
  { num: "640+",label: "Event attendance" },
  { num: "300+",label: "Launch event · Port Harcourt" },
  { num: "120+",label: "Game Over GBV · youth" },
  { num: "64",  label: "MK1 slots · May 8" },
];

export const ORGS_STRIP: string[] = [
  "Femmes aux Consoles · CM",
  "Bambina",
  "Nexal Gaming",
  "Juju Games",
  "Garden City Esports",
  "Daimyo Arena",
  "Phygital Nigeria",
  "Gameverse",
  "IGDA Foundation",
  "Ingage.gg",
  "Alliance Française PH",
  "Renaissance Innov. Labs",
  "French Embassy, NG",
  "FutureSphere BIHub",
];
