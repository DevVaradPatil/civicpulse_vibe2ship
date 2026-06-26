# CivicPulse — CLAUDE.md

Hyperlocal civic-issue platform for the **Vibe2Ship** hackathon (problem statement: *Community Hero*). Citizens report civic issues (potholes, water leaks, streetlights, waste) with a photo; an AI agent pipeline triages, dedups, routes, tracks, and verifies the fix; a dashboard shows impact + predictive hotspots. Demo scope: **Delhi**.

Full plan and phases: see [plan.md](plan.md). Submission deadline: **29 Jun 2026, 2:00 PM**.

## Hard constraints
- **Free services only.** Stay strictly within Always-Free / free tiers. No paid tiers, no Firebase Blaze.
- **Deploy on Google Cloud** (mandatory) → Cloud Run.
- **UI: minimal, modern, NO gradients, flat solid colors.** Tokens defined in `src/app/globals.css` (`@theme`). Use them (`bg-brand`, `text-muted`, `bg-sev-high`, etc.) — do not hardcode hex.

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript** — full-stack, one Cloud Run container, no separate backend.
- **Tailwind v4** (CSS-config via `@theme` in `globals.css`; no `tailwind.config.js`).
- **lucide-react** icons, **react-hot-toast** notifications, **leaflet.markercluster**.
- **Firebase Auth** (Google + Anonymous; ID tokens verified server-side via Admin SDK), **Firestore** (Admin SDK), **Google Cloud Storage** (photos), **Gemini API** (`gemini-2.5-flash`, server-side only — 2.0-flash is zeroed on free tier), **Leaflet + OpenStreetMap** (maps).
- Firebase web config is served at runtime via `/api/firebase-config` (env `FIREBASE_WEB_*`), not baked into the build.

## Layout
- `src/app/` — routes: `/` (landing), `/report`, `/map`, `/dashboard`, `/leaderboard`, `/profile`, `/u/[uid]`, `/issue/[id]`, and `/api/*`.
- `src/components/` — `site-header`, `agent-pipeline`, `issue-*`, `before-after-slider`, `charts`, `insights-widget`, `profile-view`, `auth-*`, `theme-toggle`, `ui/` primitives.
- `src/lib/domain.ts` — categories, statuses, severity helpers, Delhi config. **Single source of truth for the domain model.**
- `Dockerfile` / `.dockerignore` — Cloud Run standalone image. `next.config.ts` sets `output: "standalone"`.
- `deploy.sh` — `PROJECT_ID=... ./deploy.sh` builds from source and deploys to Cloud Run.
- `.env.example` — required env vars (Gemini, Firebase, GCS). Real secrets go in `.env.local` (gitignored).

## Commands
- `npm run dev` — dev server.
- `npm run build` — production build (also the pre-deploy check; keep it green).
- `npm run lint` — ESLint.

## Conventions
- Gemini / Firestore / GCS access is **server-side only** (route handlers + Admin SDK). Client calls our own `/api/*`.
- Tailwind v4: dynamic class names aren't detected — map tokens to **literal** class strings (see `ui/badge.tsx`).
- Keep the **minimal-AI principle**: Gemini only for Triage + Resolution Verifier (multimodal) + on-demand/cached Routing & Insights. Deterministic code elsewhere.
