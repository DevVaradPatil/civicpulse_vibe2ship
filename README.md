# CivicPulse — Hyperlocal civic-issue platform

> Report a civic issue with one photo. An **AI agent pipeline** triages it, routes it to the
> right authority, the community verifies it, and the AI confirms the fix — while a dashboard
> predicts where problems strike next.

**Built for the Vibe2Ship hackathon · Problem Statement 2: Community Hero — Hyperlocal Problem Solver**

- 🌐 **Live app:** https://civicpulse-245651121772.us-central1.run.app
- 📦 **Repo:** https://github.com/DevVaradPatil/civicpulse_vibe2ship
- 🗺️ **Demo scope:** Delhi

---

## The problem

Reporting civic issues — potholes, water leaks, broken streetlights, garbage — is fragmented,
hard to track, and lacks transparency. Reports vanish into inboxes; citizens never see if
anything happened.

## What CivicPulse does

CivicPulse closes the loop with a **multi-agent AI pipeline** plus community participation:

1. **Report** — snap or upload a photo; location is captured automatically.
2. **Triage agent** *(Gemini, multimodal)* — classifies category + severity and flags hazards.
3. **Dedup agent** *(deterministic)* — clusters nearby duplicate reports to keep signal clean.
4. **Routing agent** *(Gemini)* — drafts a formal complaint to the responsible Delhi authority
   (Jal Board / MCD / PWD), with copy & email actions.
5. **Community verification** — neighbours confirm an issue; 3 confirmations auto-verify it.
6. **Resolution Verifier agent** *(Gemini, multimodal)* — compares a "fixed" photo against the
   original and confirms the repair, closing the accountability loop.
7. **Insights agent** *(Gemini, cached)* — predicts hotspots and trends on the impact dashboard.

Citizens earn points, badges, and tiers (**Civic Rookie → Community Hero**) for participating.

### The minimal-AI principle
Gemini is used **only where it adds real value** (perception & judgment). Deduplication,
stats, hotspots, and routing-targets are deterministic code. This keeps the system fast,
cheap (free tier), and genuinely *agentic* rather than a wrapper around one prompt.

---

## Tech stack

| Layer | Choice |
|---|---|
| App | **Next.js 16** (App Router) + React 19 + TypeScript — one full-stack container |
| Styling | **Tailwind v4** (CSS `@theme` tokens) — flat, solid colors, no gradients |
| AI | **Gemini `2.5-flash`** via Google AI Studio (server-side only) |
| Auth | **Firebase Auth** (Google + Anonymous) |
| Data | **Cloud Firestore** (Admin SDK, server-side) |
| Storage | **Google Cloud Storage** (private bucket, served via a media proxy) |
| Maps | **Leaflet + OpenStreetMap** (no key, no billing) |
| Hosting | **Google Cloud Run** (single container) |
| Icons | lucide-react |

Everything runs within **free / Always-Free tiers**.

## Architecture

```
[ Next.js PWA ]  client components + server route handlers (one Cloud Run container)
      │
      ├── Gemini API (Triage · Routing · Verifier · Insights)   server-side only
      ├── Firebase Admin → Firestore (issues, users, insights)
      ├── Google Cloud Storage (issue + proof photos, private)
      └── Firebase Auth (Google + Anonymous)  ·  Leaflet + OpenStreetMap
```

## Local development

**Prerequisites:** Node 22+, a Gemini API key, and `gcloud auth application-default login`
(for Firestore/GCS access).

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

Required env vars (see `.env.example`): `GEMINI_API_KEY`, `GCS_BUCKET`, `FIREBASE_PROJECT_ID`,
and the public `NEXT_PUBLIC_FIREBASE_*` web config.

Seed a Delhi demo dataset (clears + repopulates issues/users):

```bash
node scripts/seed.mjs
```

## Deploy (Google Cloud Run)

```bash
PROJECT_ID=your-project ./deploy.sh
```

> The public `NEXT_PUBLIC_FIREBASE_*` config is inlined at build time (set in the `Dockerfile`,
> since it must reach the client bundle). Server secrets (`GEMINI_API_KEY`, etc.) are passed as
> Cloud Run runtime env vars.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `node scripts/seed.mjs` — seed demo data
- `node scripts/reset-issues.mjs` — clear issues + users

## Project structure

```
src/
  app/                routes (/, /report, /map, /dashboard, /leaderboard, /profile, /u/[uid]) + /api/*
  components/         site-header, agent-pipeline, issue-*, profile-view, auth-*, ui/*
  lib/
    agents/           triage, verifier, routing, insights  (Gemini agents)
    server/           firebase-admin, issues, users, stats, insights, storage, gemini, auth
    client/           firebase, image helpers
    domain.ts         categories / statuses / severity / Delhi config (source of truth)
    badges.ts         tiers + achievement badges
scripts/              seed + reset utilities
```

## License

Built for the Vibe2Ship hackathon. © 2026.
