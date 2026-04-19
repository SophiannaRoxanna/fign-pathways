// The six post-lesson "what next?" doors. Always include Reflect, Bring someone,
// Bookmark; the other three are tailored per lesson in lib/nextOptions.ts.

import { C } from "@/lib/design/tokens";

export type DoorId =
  | "make_something"
  | "reflect"
  | "go_further"
  | "take_it_live"
  | "bring_someone"
  | "bookmark";

export type DoorCopy = {
  id: DoorId;
  kind: string;
  title: string;
  why: string;
  commitment: string;
  color: string;
};

export const DOOR_COPY: Record<DoorId, Omit<DoorCopy, "title"> & { titleFallback: string }> = {
  make_something: {
    id: "make_something",
    kind: "Make something",
    titleFallback: "Create an artifact while it's fresh",
    why: "Try it while what you just learned is new",
    commitment: "about 10 min",
    color: C.coral,
  },
  reflect: {
    id: "reflect",
    kind: "Reflect",
    titleFallback: "Write 3 sentences: what surprised you?",
    why: "Your words feed your growth trail",
    commitment: "2 min",
    color: C.ink,
  },
  go_further: {
    id: "go_further",
    kind: "Go further",
    titleFallback: "Follow a curriculum on this",
    why: "The natural next step, if you want it",
    commitment: "multi-lesson path",
    color: C.blue, // deep purple — natural-next-step weight
  },
  take_it_live: {
    id: "take_it_live",
    kind: "Take it live",
    titleFallback: "Apply this to a real opportunity",
    why: "Paid work, because you're already here",
    commitment: "application or intro",
    color: C.purple, // partner-org vibe — real-world opportunity
  },
  bring_someone: {
    id: "bring_someone",
    kind: "Bring someone",
    titleFallback: "Tag a friend who might like this",
    why: "Growth compounds when shared",
    commitment: "30 sec",
    color: C.green,
  },
  bookmark: {
    id: "bookmark",
    kind: "Just bookmark it",
    titleFallback: "Save it for later",
    why: "Rest is valid. Come back when ready.",
    commitment: "one tap",
    color: C.inkMute,
  },
};
