// FIGN palette — v4 (brand). Pink + purple from the logo; white + black anchored.
// Key names are preserved from v3 so consumer files don't need rewriting; values
// now resolve to the brand palette Sophia actually uses.
//
// Use OKLCH in CSS where precision matters; hex below for direct JS consumption.

export const C = {
  // Surfaces — light theme (authed app)
  paper:    "#FEFCFD",   // canvas, pink-tinted near-white
  paperAlt: "#F7F2F9",   // card surface, purple-tinted
  paperDk:  "#EFE9F0",   // inset / footer strip
  hairline: "#E5DBEA",   // soft dividers, input borders

  // Ink — light theme
  ink:      "#120B17",   // primary text + 1.5px borders (not pure #000)
  inkSoft:  "#3B3540",   // body copy
  inkMute:  "#7D7686",   // captions, timestamps, placeholders

  // Brand — pink (umbrella · FIGN)
  coral:     "#FF2F92",  // hot magenta; chip bg for umbrella, `<em>` on dark only
  coralDk:   "#CC1F74",  // pressed/hover + body `<em>` on light (AA-safe)
  coralSoft: "#FFE0F0",  // pink-wash surface (success state, brand banners)

  // Brand — purple (member_orgs + chapters + open)
  purple:     "#6C4AB6", // chip bg for member_org, default secondary brand
  purpleSoft: "#E9DFFF", // purple-wash surface
  purpleDeep: "#4A2A8F", // pressed/hover + partner chip bg

  // Remapped from v3 (consumers still call these names; values pivoted)
  blue:    "#4A2A8F",    // was blue; now = purpleDeep. Partner chips.
  gold:    "#6C4AB6",    // was gold; now = purple. Open-source orgs.
  green:   "#2D8653",    // system success only — lesson-done, saved states
  greenLt: "#FFE0F0",    // success-card wash — now pink (coralSoft), more brand-consistent

  // System
  danger:     "#B32A3C", // error states, used text+icon first
  dangerSoft: "#FDE7EA", // wash background under danger text/borders

  // Dark theme (marketing surfaces: / and /signin)
  canvasDark:      "#140A1A", // marketing background, near-black tinted toward purple
  surfaceDark:     "#221434", // card surface on dark
  surfaceDarkAlt:  "#1A0E25", // deeper inset
  inkOnDark:       "#F4EDF6", // body text on dark
  inkOnDarkMute:   "#B8ACC5", // captions on dark
  hairlineDark:    "#3A2050", // dividers on dark
} as const;

export type ColorKey = keyof typeof C;

// Default chip colour per org type when an org hasn't set its own brand_color.
// Consumers resolve: org.brand_color || ORG_TYPE_COLOR[org.type] || C.ink
export const ORG_TYPE_COLOR: Record<string, string> = {
  umbrella:   C.coral,      // FIGN itself — pink
  member_org: C.purple,
  partner:    C.blue,       // deep purple, distinct-enough from member_org
  chapter:    C.coral,      // FIGN chapters ARE FIGN locally
  open:       C.purple,     // open-source content hosts
};
