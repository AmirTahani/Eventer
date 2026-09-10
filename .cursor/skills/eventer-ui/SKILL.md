---
name: eventer-ui
description: Eventer's product UI system. Use when building, restyling, or reviewing Frontend pages, MUI components, the marketing homepage, dashboard, login, or any Eventer web UI.
paths:
  - "Frontend/**/*.tsx"
  - "Frontend/**/*.ts"
---

# Eventer UI

Eventer is a private, invite-gated event platform. Guests live in Telegram. Organizers use a web console. The look is a quiet members' club, not a consumer SaaS template.

When working on Frontend UI, follow this order:

1. **Brand first** — existing theme and components, not a new visual identity
2. **Craft** — read `effective-ui-design` for spacing, type, forms, contrast, motion
3. **Components** — read `ui-design-brain` for the specific control you are building
4. **Performance** — read `vercel-react-best-practices` for Next.js / React
5. **After shipping UI** — run `web-design-guidelines` as an audit

Use `frontend-design` for composition, hierarchy, and anti-slop judgment. Do **not** let it invent a new palette, type stack, or "signature gimmick" for Eventer. This product already has a visual system.

## Visual system (already implemented)

Source of truth: `Frontend/src/theme/theme.ts`

| Role | Choice |
|---|---|
| Display | Source Serif 4 (Vazirmatn when `fa`) |
| Body | Source Sans 3 (Vazirmatn when `fa`) |
| Light bg / paper | `#F3F5F7` / `#FFFFFF` |
| Dark bg / paper | `#0E1116` / `#161B22` |
| Primary | teal `#0F766E` light, `#2DD4BF` dark |
| Radius | 8px |
| Density | console-tight on dashboard, more air on marketing `/` |

Reuse MUI components already in the app (`Button`, `Paper`, `Chip`, `AppBar`, `DataGrid`). Do not add Tailwind, shadcn, or a second component library.

## Product tone

- Invite-only. No public signup energy. No "Join thousands of users" copy.
- Primary action per screen is one contained teal button. Secondary is outlined. Destructive is outlined error.
- Dashboard is dense data (tables, check-in, audit). Marketing homepage can be editorial.
- Motion: 200–250ms ease-out. No bounce, no staggered card fade-ins.
- Dark mode is first-class. Theme toggle already exists (`ThemeModeSwitch`).

## Do not

- Swap fonts to Inter, Space Grotesk, or a new display face
- Introduce purple gradients, gold luxury, or neon accents
- Rebuild primitives that MUI already provides
- Ship UI without checking light **and** dark, plus a ~390px viewport
- Skip browser verification for user-visible Frontend changes
