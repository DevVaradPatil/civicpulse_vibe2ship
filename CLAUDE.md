# CivicPulse — CLAUDE.md

Hyperlocal civic-issue platform for the **Vibe2Ship** hackathon (problem statement: *Community Hero*). Citizens report civic issues (potholes, water leaks, streetlights, waste) with a photo; an AI agent pipeline triages, dedups, routes, tracks, and verifies the fix; a dashboard shows impact + predictive hotspots. Demo scope: **Delhi**.

Full plan and phases: see [plan.md](plan.md). Submission deadline: **29 Jun 2026, 2:00 PM**.

## Hard constraints
- **Free services only.** Stay strictly within free tiers. No paid tiers, no billing accounts.
- **Deployed on Vercel + Supabase.** (Originally Google Cloud Run; migrated off after the
  GCP project was deleted — see `DEPLOY-VERCEL.md`.)
- **UI: minimal, modern, NO gradients, flat solid colors.** Tokens defined in `src/app/globals.css` (`@theme`). Use them (`bg-brand`, `text-muted`, `bg-sev-high`, etc.) — do not hardcode hex.

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript** — full-stack, deployed on Vercel, no separate backend.
- **Tailwind v4** (CSS-config via `@theme` in `globals.css`; no `tailwind.config.js`).
- **lucide-react** icons, **react-hot-toast** notifications, **leaflet.markercluster**.
- **Supabase**: Postgres (data), Storage (private `media` bucket for photos), Auth (**anonymous**;
  access tokens verified server-side). **Gemini API** (`gemini-2.5-flash`, server-side only —
  2.0-flash is zeroed on free tier), **Leaflet + OpenStreetMap** (maps).
- Server uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS, never client-side). The browser only
  gets the anon key, used solely for anonymous auth — every table has RLS on with no policies.

## Layout
- `src/app/` — routes: `/` (landing), `/report`, `/map`, `/dashboard`, `/leaderboard`, `/profile`, `/u/[uid]`, `/issue/[id]`, and `/api/*`.
- `src/components/` — `site-header`, `agent-pipeline`, `issue-*`, `before-after-slider`, `charts`, `insights-widget`, `profile-view`, `auth-*`, `theme-toggle`, `ui/` primitives.
- `src/lib/domain.ts` — categories, statuses, severity helpers, Delhi config. **Single source of truth for the domain model.**
- `supabase/schema.sql` — tables + atomic RPCs (`award_points`, `confirm_issue`). Run once in the
  Supabase SQL editor.
- `DEPLOY-VERCEL.md` — full setup/deploy guide.
- `.env.example` — required env vars (Gemini + Supabase). Real secrets go in `.env.local` (gitignored).

## Commands
- `npm run dev` — dev server.
- `npm run build` — production build (keep it green).
- `node --env-file=.env.local scripts/seed.mjs` — seed ~30 demo issues (non-destructive).
- `npm run lint` — ESLint.

## Conventions
- Gemini / Supabase access is **server-side only** (route handlers + service-role key). Client calls our own `/api/*`.
- Tailwind v4: dynamic class names aren't detected — map tokens to **literal** class strings (see `ui/badge.tsx`).
- Keep the **minimal-AI principle**: Gemini only for Triage + Resolution Verifier (multimodal) + on-demand/cached Routing & Insights. Deterministic code elsewhere.
