# CivicPulse — Hyperlocal civic-issue platform

> Report a civic issue with one photo. A **multi-agent AI pipeline** triages it, routes it to
> the right authority, the community verifies it, and the AI confirms the fix — while a live
> dashboard predicts where problems strike next.

**Built for the Vibe2Ship hackathon · Problem Statement 2: Community Hero — Hyperlocal Problem Solver**

- 🌐 **Live app:** deployed on Vercel — see [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)
- 📦 **Repo:** https://github.com/DevVaradPatil/civicpulse_vibe2ship
- 🗺️ **Demo scope:** Delhi

---

## The problem

Reporting civic issues — potholes, water leaks, broken streetlights, garbage — is fragmented,
hard to track, and lacks transparency. Reports vanish into inboxes; citizens never see if
anything happened.

## How CivicPulse works

A citizen photographs an issue; from there an **orchestrated pipeline of AI agents** plus the
community drives it to resolution:

1. **Report** — snap or upload a photo (with an optional category hint); location is captured.
2. **🤖 Triage agent** *(Gemini, multimodal)* — category, severity (1–5), hazards, confidence.
3. **⚙️ Dedup agent** *(deterministic)* — clusters nearby same-category reports.
4. **🤖 Routing agent** *(Gemini)* — drafts a formal complaint to the responsible Delhi authority
   (Jal Board / MCD / PWD) with priority + SLA, plus copy & email actions.
5. **👥 Community verification** — confirmations (3 auto-verify an issue); status lifecycle
   Reported → Verified → In Progress → Resolved with a visual timeline.
6. **🤖 Resolution Verifier agent** *(Gemini, multimodal)* — compares a "fixed" photo with the
   original and confirms the repair, closing the loop.
7. **🤖 Insights agent** *(Gemini, cached)* — predicts hotspots and trends on the dashboard.

Every issue page shows the **agent pipeline** with each step's status and reasoning.

### Minimal-AI principle
Gemini is used **only where it adds real value** (visual perception + judgment). Deduplication,
statistics, hotspot detection, and authority routing are deterministic code. The result is a
true *agentic* system that stays fast and within free tiers.

## Features

- **AI report flow** — camera/upload, client-side compression, live triage, editable result.
- **Interactive map** — Leaflet + OpenStreetMap, **4 base layers** (Light / Streets / Dark /
  Satellite), **marker clustering**, category + status filters, color-by severity/category, legend.
- **Issue tracking** — status timeline, community confirm, AI fix-verification with a draggable
  **before/after slider**, AI-drafted authority complaint.
- **Impact dashboard** — colored stat cards, status donut, 7-day trend chart, category/severity
  breakdowns, predicted hotspots, and a floating **AI insights** widget (auto-runs, cached).
- **Community heroes** — **Supabase anonymous auth**, public profiles (`/u/[uid]`),
  tiers (Civic Rookie → Community Hero), achievement badges, points, and a podium leaderboard.
- **Polished UX** — flat minimal design (no gradients), **dark mode**, toast notifications,
  mobile-friendly, loading skeletons.

## Tech stack

| Layer | Choice |
|---|---|
| App | **Next.js 16** (App Router) + React 19 + TypeScript — full-stack, no separate backend |
| Styling | **Tailwind v4** (CSS `@theme` tokens), lucide-react, react-hot-toast |
| AI | **Gemini `2.5-flash`** via Google AI Studio (server-side only) |
| Auth | **Supabase Auth** (anonymous), server-verified access tokens |
| Data | **Supabase Postgres** (service-role key, server-side only) |
| Storage | **Supabase Storage** (private bucket, served via a media proxy) |
| Maps | **Leaflet + OpenStreetMap** + leaflet.markercluster (no key, no billing); geofire-common |
| Hosting | **Vercel** (Next.js native, free Hobby tier) |

Everything runs within **free / Always-Free tiers**.

## Architecture

```
[ Next.js app on Vercel ]   client components + server route handlers
      │
      ├── Gemini API        Triage · Routing · Verifier · Insights  (server-side only)
      ├── Supabase Postgres issues, users, cached insights
      ├── Supabase Auth     anonymous sign-in + token verification
      ├── Supabase Storage  issue + proof photos (private, via /api/media)
      └── Leaflet + OSM     map tiles + clustering
```

## Local development

See **[DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)** for the full setup (Supabase project, schema,
storage bucket, anonymous auth, and Vercel deploy).

```bash
npm install
cp .env.example .env.local          # fill in Gemini + Supabase values
npm run dev                         # http://localhost:3000
node --env-file=.env.local scripts/seed.mjs   # ~30 Delhi demo issues
```

## Scripts

- `npm run dev` / `npm run build` / `npm run lint`
- `node --env-file=.env.local scripts/seed.mjs` — seed ~30 demo issues + users
- `node --env-file=.env.local scripts/reset-issues.mjs` — clear seed data

## Project structure

```
src/
  app/                routes: /, /report, /map, /dashboard, /leaderboard, /profile, /u/[uid],
                      /issue/[id], and /api/* (triage, issues[+confirm/progress/resolve/complaint],
                      dashboard, insights, leaderboard, me, users, media)
  components/         site-header, agent-pipeline, issue-*, before-after-slider, charts,
                      insights-widget, profile-view, auth-provider, theme-toggle, ui/*
  lib/
    agents/           triage, routing, verifier, insights  (Gemini agents)
    server/           supabase, issues, users, stats, insights, storage, gemini, auth
    client/           supabase, image helpers
    domain.ts         categories / statuses / severity / Delhi config (source of truth)
    colors.ts         chart/marker color maps   ·   badges.ts  tiers + badges
scripts/              seed + reset utilities
```

## License

Built for the Vibe2Ship hackathon. © 2026.
