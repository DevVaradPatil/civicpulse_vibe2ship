# CivicPulse — Hyperlocal civic-issue platform

> Report a civic issue with one photo. A **multi-agent AI pipeline** triages it, routes it to
> the right authority, the community verifies it, and the AI confirms the fix — while a live
> dashboard predicts where problems strike next.

**Built for the Vibe2Ship hackathon · Problem Statement 2: Community Hero — Hyperlocal Problem Solver**

- 🌐 **Live app:** https://civicpulse-245651121772.us-central1.run.app
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
- **Community heroes** — **Firebase Auth** (Google + anonymous), public profiles (`/u/[uid]`),
  tiers (Civic Rookie → Community Hero), achievement badges, points, and a podium leaderboard.
- **Polished UX** — flat minimal design (no gradients), **dark mode**, toast notifications,
  mobile-friendly, loading skeletons.

## Tech stack

| Layer | Choice |
|---|---|
| App | **Next.js 16** (App Router) + React 19 + TypeScript — one full-stack container |
| Styling | **Tailwind v4** (CSS `@theme` tokens), lucide-react, react-hot-toast |
| AI | **Gemini `2.5-flash`** via Google AI Studio (server-side only) |
| Auth | **Firebase Authentication** (Google + Anonymous), server-verified ID tokens |
| Data | **Cloud Firestore** (Firebase Admin SDK, server-side) |
| Storage | **Google Cloud Storage** (private bucket, served via a media proxy) |
| Maps | **Leaflet + OpenStreetMap** + leaflet.markercluster (no key, no billing); geofire-common |
| Hosting | **Google Cloud Run** (single Docker container, built by Cloud Build) |

Everything runs within **free / Always-Free tiers**.

## Architecture

```
[ Next.js app on Cloud Run ]   client components + server route handlers
      │
      ├── Gemini API        Triage · Routing · Verifier · Insights  (server-side only)
      ├── Firebase Admin →  Firestore (issues, users, cached insights)
      ├── Firebase Auth     ID-token verification (report / confirm / resolve)
      ├── Cloud Storage     issue + proof photos (private, via /api/media)
      └── Leaflet + OSM     map tiles + clustering
```

## Local development

**Prerequisites:** Node 22+, a Gemini API key, a Firebase web config, and
`gcloud auth application-default login` (for Firestore/GCS access).

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
node scripts/seed.mjs        # seed a Delhi demo dataset (~30 issues)
```

Env vars (see `.env.example`): `GEMINI_API_KEY`, `GCS_BUCKET`, `FIREBASE_PROJECT_ID`, and the
public `FIREBASE_WEB_*` web config (served to the client at runtime via `/api/firebase-config`).

## Deploy (Google Cloud Run)

```bash
PROJECT_ID=your-project ./deploy.sh
# then set runtime env (incl. FIREBASE_WEB_*) via:
#   gcloud run services update civicpulse --update-env-vars KEY=VALUE,...
```

> The Firebase web config is **not** baked into the image — it's served from server env at
> runtime, so it stays out of the repo/bundle. Server secrets (`GEMINI_API_KEY`) are Cloud Run
> runtime env vars.

## Scripts

- `npm run dev` / `npm run build` / `npm run lint`
- `node scripts/seed.mjs` — seed ~30 demo issues + users
- `node scripts/reset-issues.mjs` — clear issues + users

## Project structure

```
src/
  app/                routes: /, /report, /map, /dashboard, /leaderboard, /profile, /u/[uid],
                      /issue/[id], and /api/* (triage, issues[+confirm/progress/resolve/complaint],
                      dashboard, insights, leaderboard, me, users, media, firebase-config)
  components/         site-header, agent-pipeline, issue-*, before-after-slider, charts,
                      insights-widget, profile-view, auth-*, theme-toggle, ui/*
  lib/
    agents/           triage, routing, verifier, insights  (Gemini agents)
    server/           firebase-admin, issues, users, stats, insights, storage, gemini, auth
    client/           firebase, image helpers
    domain.ts         categories / statuses / severity / Delhi config (source of truth)
    colors.ts         chart/marker color maps   ·   badges.ts  tiers + badges
scripts/              seed + reset utilities
```

## License

Built for the Vibe2Ship hackathon. © 2026.
