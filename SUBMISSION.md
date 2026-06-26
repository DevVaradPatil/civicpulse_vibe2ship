# CivicPulse — Project Description

> Paste this into a public Google Doc (link-accessible) for submission.

**Live app:** https://civicpulse-245651121772.us-central1.run.app
**GitHub:** https://github.com/DevVaradPatil/civicpulse_vibe2ship

---

## Problem Statement Selected

**Problem Statement 2 — Community Hero: Hyperlocal Problem Solver.**

Communities face constant civic issues — potholes, water leakages, damaged streetlights, waste
and public-infrastructure problems. Reporting them is fragmented, hard to track, and lacks
transparency, so citizens disengage and issues linger.

## Solution Overview

CivicPulse is a hyperlocal civic-issue platform that turns a single citizen photo into a
tracked, verified, and resolved civic action — and closes the accountability loop with AI.

A citizen photographs an issue. A **multi-agent AI pipeline** then:
1. **Triages** it from the image (category, severity, hazards),
2. **De-duplicates** it against nearby reports,
3. **Routes** it by drafting a formal complaint to the responsible Delhi authority,
4. lets the **community verify** it (confirmations auto-advance the status),
5. **verifies the fix** by comparing an "after" photo to the original, and
6. surfaces **predictive hotspots** and trends on an impact dashboard.

Citizens are recognised as **Community Heroes** through points, badges, and tiers, with public
profiles showing their contributions. The result is transparency (every issue is tracked and
mapped), accountability (AI verifies the actual fix), and participation (gamified community
verification).

**Guiding principle — minimal, meaningful AI:** Gemini is used only where it adds genuine value
(visual perception and judgment). Deduplication, statistics, hotspot detection, and
authority-routing targets are deterministic code. This makes the system a true *agentic
pipeline* — agents that reason and use tools — rather than a single prompt wrapper, while
staying entirely within free tiers.

## Key Features

- **Photo-first reporting** with automatic geolocation and an optional category hint.
- **AI Triage agent** — multimodal classification of category, severity (1–5) and hazards.
- **Deduplication agent** — clusters nearby same-category reports to keep the signal clean.
- **AI Routing agent** — drafts a formal, ready-to-send complaint to the correct authority
  (Delhi Jal Board / MCD / PWD) with priority and an SLA estimate; copy & email actions.
- **Community verification** — one-tap confirmations; 3 confirmations auto-verify an issue.
- **Status lifecycle** — Reported → Verified → In Progress → Resolved, with a visual timeline.
- **AI Resolution Verifier** — multimodal before/after comparison that confirms the repair.
- **Visible agent pipeline** — every issue shows each agent's step, status, and reasoning.
- **Impact dashboard** — resolution rate, breakdowns, and an **AI Insights agent** producing
  predictive hotspot and trend insights with Delhi context.
- **Interactive map** of all issues (Leaflet + OpenStreetMap), severity-coloured.
- **Gamification & profiles** — points, achievement badges, tiers (Civic Rookie → Community
  Hero), a leaderboard, and public profiles showing each hero's reports.
- **Authentication** — Google sign-in with anonymous fallback (report without an account).
- **Minimal, modern, flat UI** — accessible, mobile-first, no gradients.

## Technologies Used

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — full-stack single container
- **Tailwind CSS v4** — design tokens via CSS `@theme` (flat, solid palette)
- **Leaflet + OpenStreetMap** — mapping (no key, no billing)
- **lucide-react** — icons
- **Docker** — standalone container image for Cloud Run

## Google Technologies Utilized

- **Google Gemini API** (`gemini-2.5-flash`, via Google AI Studio) — the four AI agents:
  Triage, Routing, Resolution Verifier, and Insights (multimodal + structured JSON output).
- **Google Cloud Run** — hosting the containerized app (mandatory deployment target).
- **Cloud Firestore** — primary datastore for issues, users, and cached insights.
- **Firebase Authentication** — Google sign-in + anonymous auth.
- **Google Cloud Storage** — issue and resolution photos (private bucket via a media proxy).
- **Google Cloud Build** — source-to-container builds for deployment.

All services run within Google Cloud / Firebase **free / Always-Free tiers**.

## Agentic Depth (how the agents work together)

CivicPulse is an **orchestrated pipeline of specialised agents**, not a single model call. Each
agent has a narrow responsibility and either reasons over multimodal input (Triage, Verifier)
or text + structured data (Routing, Insights), while deterministic "tools" (geo-deduplication,
aggregation, authority lookup) handle the rest. The pipeline makes autonomous decisions —
auto-verifying issues at a confirmation threshold, confirming or rejecting a claimed fix from
photographic evidence, and routing to the correct department — and exposes each step to the
user for full transparency.

## What makes it innovative

Most civic apps stop at "report a pothole." CivicPulse **closes the loop**: the AI not only
triages and routes the issue, it **verifies that the fix actually happened** from a photo, and
it **predicts where problems will recur**. Combined with community verification and a
hero-recognition system, it turns passive reporting into an accountable, self-reinforcing civic
cycle.
