# FIGN — reference prototypes

Historical snapshots that informed the v3 build. Kept as-is.

- [`fign-build-plan.md`](fign-build-plan.md) — v3 federation spec + v4 learning layer (§12–17). Text-level design principles in §1 and §9 still apply; specific palette hexes in the prose refer to the **retired v3 editorial direction**.
- [`fign-landing.jsx`](fign-landing.jsx) — three-door landing prototype, cream/coral palette.
- [`fign-member-home.jsx`](fign-member-home.jsx) — `/map` home prototype with interest map + Skills Lab + learning panels, cream/coral palette.
- [`fign-learn.jsx`](fign-learn.jsx) — `/learn` full library prototype (Phase 2.5, unimplemented).

## Palette revision — please read before copying colours from these files

The JSX prototypes use the v3 editorial cream/coral palette:

```
paper #f5ecdc · ink #1a1410 · coral #c94a2a · purple #6b3a7a · blue #2b5a8a · gold #a67c1e
```

**That palette is retired.** Sophia flagged it as reading AI-default rather than on-brand. The live palette is pink `#FF2F92` + purple `#6C4AB6` + white `#FEFCFD` + black `#120B17`, drawn from the FIGN logo.

When referencing these prototypes for layout, composition, typography *structure*, or interaction patterns — use them freely. When referencing for colour — translate through the v4 tokens in [`../lib/design/tokens.ts`](../lib/design/tokens.ts), never copy the hexes directly.

See [`../CLAUDE.md`](../CLAUDE.md) and [`../.impeccable.md`](../.impeccable.md) for the current Design Context.
