# 7. Design System — Material UI, Luxury Navy Palette

## 7.1 Why MUI here (vs the earlier Tailwind/shadcn suggestion)

Frontend recommendation: **Material UI (MUI v6)** on Next.js App Router.
Reasons this fits this specific product better than the earlier Tailwind/shadcn call:

- This is an events/ticketing product where a lot of the dashboard is **dense data**
  (registration tables, check-in lists, audit logs) — MUI's `DataGrid`, `Table`, `Dialog`,
  `Stepper`, and form components are production-grade out of the box, which matters more
  here than for a marketing-style site.
- **RTL for Farsi** is a first-class MUI feature (`stylis-plugin-rtl` + `<CacheProvider>`
  + `theme.direction = 'rtl'`), arguably cleaner to wire correctly than retrofitting RTL
  across a large Tailwind utility-class codebase.
- A "luxury" visual identity is a **theming exercise** — MUI's theme object (palette,
  typography, shape, component overrides) is the right tool for enforcing one consistent
  look everywhere, versus hand-tuning Tailwind classes per component and risking drift.

Trade-off to accept: MUI ships more CSS/JS than a bare Tailwind setup and has a more
opinionated component look you're overriding rather than building up from nothing —
acceptable here since consistency matters more than bundle-shaving for an internal-ish
Organizer/Admin dashboard.

Next.js App Router + MUI setup note: MUI needs an Emotion cache provider wired into the
root layout (`Frontend/src/app/layout.tsx`) for correct SSR style injection — this is a
solved, documented pattern (`@mui/material-nextjs/v14-appRouter`), not a risk, just a
setup step to remember in M13.

## 7.2 Luxury color palette — navy & blue

Direction: **deep navy/near-black neutrals + a two-tone blue accent system**
(royal/cobalt blue as the primary action color, a cooler steel-blue as secondary),
no warm accents at all — reads as precise, exclusive, "private members' club" rather than
the earlier gold direction. Status colors stay muted/desaturated so they don't fight the
blue-dominant palette.

| Token | Hex | Usage |
|---|---|---|
| `background.default` | `#070B14` | App background (dark mode is the primary/default mode — fits "private club" tone) |
| `background.paper` | `#0F1626` | Cards, dialogs, table surfaces |
| `background.subtle` | `#161F35` | Nested surfaces, hover states |
| `primary.main` | `#2E5AAC` | Royal/cobalt blue — primary actions, active nav, price tags, tier "premium" indicators |
| `primary.light` | `#5C82C9` | Hover/lighter blue |
| `primary.dark` | `#173868` | Pressed states, and doubles as the true "dark navy" brand tone for headers/nav backgrounds |
| `primary.contrastText` | `#F3F4F7` | Text on blue buttons |
| `secondary.main` | `#7C8CA6` | Cool steel-blue-gray — secondary actions, neutral chips, borders on non-primary elements |
| `text.primary` | `#EDEFF4` | Cool off-white, not pure white — softer on dark navy bg |
| `text.secondary` | `#9AA3B5` | Muted blue-gray |
| `divider` | `rgba(92,130,201,0.16)` | Hairline blue-tinted dividers instead of flat gray — reinforces the palette even in structural UI chrome |
| `success.main` | `#3F9C74` | Confirmed / payment success |
| `warning.main` | `#C99A3E` | Pending / waitlist / approaching-full — the one deliberately warm color in the palette, purely for at-a-glance semantic contrast against an otherwise all-blue UI |
| `error.main` | `#B0453F` | Rejected / cancelled / expired — muted brick red, not a harsh alert red |
| `info.main` | `#4E7FB0` | Neutral informational (e.g. "location hidden until release") — sits between primary and secondary in the blue family, intentionally close so info banners read as "part of the system," not an alert |

**Light mode variant** (for anyone who prefers it, or for print/export views like ticket
PDFs): swap backgrounds to `#F5F7FA` (cool ivory-white, not stark white) /
`#FFFFFF` paper, keep the same navy/blue primary and status accents — `primary.dark`
(`#173868`) becomes the workhorse accent on light backgrounds since the lighter blues
lose contrast on white.

## 7.3 Typography

- **Display/headings:** a refined serif — `"Playfair Display"` (or `"Fraunces"` as an
  alternative with a bit more character) for event names, dashboard section titles,
  ticket headers. This is where "luxury" is signaled most; paired with navy it reads
  closer to a private bank / yacht club than a nightlife app, which fits the "private
  event" positioning.
- **Body/UI:** a clean grotesk — `"Inter"` for everything else (forms, tables, buttons,
  bot-rendered text where applicable) — keeps dense dashboard screens legible at small
  sizes, which a display serif would not.
- **Farsi:** pair with `"Vazirmatn"` (excellent, modern, open-source Farsi typeface with
  good Latin-numeral support) for both display and body in `fa` locale — `Playfair
  Display` has no Arabic/Farsi glyphs, so the theme must swap the font family based on
  `theme.direction`/locale, not just flip layout direction.

## 7.4 MUI theme object (starting point for M13)

```ts
// Frontend/src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const getTheme = (direction: 'ltr' | 'rtl', locale: 'en' | 'fa') =>
  createTheme({
    direction,
    palette: {
      mode: 'dark',
      background: { default: '#070B14', paper: '#0F1626' },
      primary: {
        main: '#2E5AAC',
        light: '#5C82C9',
        dark: '#173868',
        contrastText: '#F3F4F7',
      },
      secondary: { main: '#7C8CA6' },
      success: { main: '#3F9C74' },
      warning: { main: '#C99A3E' },
      error: { main: '#B0453F' },
      info: { main: '#4E7FB0' },
      text: { primary: '#EDEFF4', secondary: '#9AA3B5' },
      divider: 'rgba(92,130,201,0.16)',
    },
    typography: {
      fontFamily: locale === 'fa'
        ? '"Vazirmatn", sans-serif'
        : '"Inter", sans-serif',
      h1: { fontFamily: locale === 'fa' ? '"Vazirmatn", serif' : '"Playfair Display", serif', fontWeight: 600 },
      h2: { fontFamily: locale === 'fa' ? '"Vazirmatn", serif' : '"Playfair Display", serif', fontWeight: 600 },
      h3: { fontFamily: locale === 'fa' ? '"Vazirmatn", serif' : '"Playfair Display", serif', fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { padding: '10px 20px' },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 14px rgba(46,90,172,0.35)' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' }, // avoid MUI's default dark-mode elevation overlay washing out the palette
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(92,130,201,0.14)',
            backgroundColor: '#0F1626',
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundColor: '#173868', backgroundImage: 'none' },
        },
      },
    },
  });
```

RTL wiring (M13, alongside the theme above):

```ts
// Frontend/src/app/providers.tsx
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';

const cacheRtl = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });
const cacheLtr = createCache({ key: 'mui' });
// select cacheRtl/cacheLtr and getTheme('rtl'|'ltr', locale) together based on current locale
```

## 7.5 Component/UX conventions

- **Event cards** (dashboard event list, and the reference for how Telegram card copy
  should be structured too): serif event name, blue price chip, muted "Hidden until
  released" info chip for location pre-release (uses `info.main`), status chip color-coded
  per `Event.status` (OPEN=success, FULL=warning, CANCELLED=error, DRAFT=neutral gray).
- **Tables** (`Registrations`, `Attendees`, `Audit Logs`): MUI `DataGrid` with sticky
  header, dense row option toggle, status column always rendered as a `Chip`, never plain
  text — consistent color language across the whole dashboard.
- **Primary actions** (Publish, Approve, Release Location, Check In) always use
  `variant="contained" color="primary"` (blue) — reserve the primary blue exclusively for
  the single most important action per screen so it doesn't get diluted; secondary
  actions use `variant="outlined"`, destructive ones (Cancel Event, Reject) use
  `color="error"` with `variant="outlined"` (not filled — filled red on a dark navy
  palette reads alarmist; outlined is firm without clashing).
- **Navigation/app bar:** use `primary.dark` (`#173868`, the true navy) as the app bar/nav
  background rather than the brighter `primary.main` — keeps the deepest, most "brand"
  color as structural chrome and reserves the brighter cobalt blue purely for
  interactive/actionable elements, so the eye always knows what's clickable.
- **QR/ticket display:** render on the cool-ivory light surface even in an otherwise-dark
  app (a ticket is meant to be screenshotted/printed) — a dedicated `TicketCard`
  component always forces light mode locally regardless of the app-wide theme mode.
- **Motion:** keep transitions minimal and slow (200–250ms ease-out on hover/press) —
  restraint reads as premium; snappy bouncy motion reads as a consumer app, which is the
  opposite of the intended tone.
- **Icons:** MUI icons are fine for utility UI (nav, table actions); for anything
  brand-facing (empty states, the bot's own visual identity if you ever add a logo/mark)
  avoid default Material icon shapes — they read as generic Google-Material rather than
  luxury. A thin-line custom icon set is a nice-to-have, not MVP-blocking.

## 7.6 Where this plugs into the roadmap

This theme is the deliverable for the start of **M13 (Web Dashboard)** in
`06-roadmap.md` — `Frontend/src/theme` gets the theme file, font loading
(`next/font` for Inter/Playfair Display, self-hosted Vazirmatn), and the base
`ThemeProvider`/RTL cache wiring before any dashboard screens are built, so every
subsequent screen in M13 is built against the final palette rather than restyled after
the fact. Visual-regression snapshot tests for the theme itself are covered in
`08-testing-strategy.md §8.3`.
