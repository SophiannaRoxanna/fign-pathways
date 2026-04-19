export const C = {
  paper:    "#f5ecdc",
  paperAlt: "#ece1cc",
  paperDk:  "#ddcfb4",
  ink:      "#1a1410",
  inkSoft:  "#4a3d30",
  inkMute:  "#8a7a68",
  coral:    "#c94a2a",
  coralDk:  "#8a2e14",
  green:    "#1f7a3f",
  greenLt:  "#e8f4ec",
  blue:     "#2b5a8a",
  purple:   "#6b3a7a",
  gold:     "#a67c1e",
} as const;

export type ColorKey = keyof typeof C;

export const ORG_TYPE_COLOR: Record<string, string> = {
  umbrella:    C.coral,
  member_org:  C.purple,
  partner:     C.blue,
  chapter:     C.coral,
  open:        C.gold,
};
