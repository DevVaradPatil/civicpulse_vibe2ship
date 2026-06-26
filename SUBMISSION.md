# CivicPulse — Project Description

> Copy everything below into a **public Google Doc** ("anyone with the link can view") and submit
> that link. Live app and repo are listed at the top.

**Live app:** https://civicpulse-245651121772.us-central1.run.app
**GitHub:** https://github.com/DevVaradPatil/civicpulse_vibe2ship

---

## Problem Statement Selected

**Problem Statement 2 — Community Hero: Hyperlocal Problem Solver.**

Communities face constant civic issues — potholes, water leakages, damaged streetlights, waste,
and public-infrastructure problems. Reporting them today is fragmented, hard to track, and lacks
transparency, so issues linger and citizens disengage. CivicPulse enables citizens to identify,
report, validate, track, and resolve these issues through collaboration, data, and intelligent
automation — with transparency and accountability at its core.

## Solution Overview

CivicPulse turns a single citizen photo into a tracked, verified, and resolved civic action, and
closes the accountability loop with AI. When a citizen photographs an issue, an **orchestrated
pipeline of AI agents** works alongside the community:

1. A **Triage agent** reads the photo and determines category, severity, and hazards.
2. A **Deduplication agent** clusters nearby reports so the signal stays clean.
3. A **Routing agent** drafts a formal complaint to the correct Delhi authority.
4. The **community verifies** the issue (confirmations auto-advance its status).
5. A **Resolution Verifier agent** compares a "fixed" photo with the original to confirm the repair.
6. An **Insights agent** predicts hotspots and trends on an impact dashboard.

Citizens are recognised as **Community Heroes** through points, achievement badges, tiers, and
public profiles — gamifying civic participation. Every issue exposes its **AI agent pipeline**, so
the automation is transparent to users and judges alike.

**Design principle — minimal, meaningful AI:** Gemini is used only where it adds genuine value
(visual perception and judgment). Deduplication, statistics, hotspot detection, and authority
routing are deterministic code. This makes CivicPulse a true *agentic pipeline* — agents that
reason and use tools — rather than a single prompt wrapper, while staying entirely within free tiers.

## Key Features

- **Photo-first AI reporting** — camera or gallery upload, automatic geolocation, optional
  category hint, and live AI triage (category, severity 1–5, hazards, confidence).
- **AI Routing agent** — drafts a ready-to-send formal complaint to the responsible authority
  (Delhi Jal Board / MCD / PWD) with priority and SLA; one-tap copy and email.
- **Community verification & lifecycle** — one-tap confirmations (3 auto-verify); status flow
  Reported → Verified → In Progress → Resolved with a visual timeline.
- **AI Resolution Verifier** — multimodal before/after comparison that confirms a fix, shown via
  a draggable before/after photo slider.
- **Visible agent pipeline** — each issue shows every agent's step, status, and reasoning.
- **Interactive map** — Leaflet + OpenStreetMap with four base layers (Light/Streets/Dark/
  Satellite), marker clustering, category & status filters, color-by severity/category, and a legend.
- **Impact dashboard** — colored stat cards, status donut, 7-day trend chart, category/severity
  breakdowns, predicted hotspots, and a floating, auto-running AI insights widget.
- **Community heroes** — Google sign-in (with anonymous fallback), public profiles, tiers
  (Civic Rookie → Community Hero), achievement badges, points, and a podium leaderboard.
- **Polished, accessible UX** — flat minimal design, dark mode, toast notifications, mobile-first,
  loading skeletons.

## Technologies Used

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — full-stack single container.
- **Tailwind CSS v4** — design tokens via CSS `@theme` (flat, solid palette; dark mode).
- **Leaflet + OpenStreetMap** + **leaflet.markercluster** — mapping (no key, no billing).
- **react-hot-toast** — notifications; **lucide-react** — icons; **geofire-common** — geohashing.
- **Docker** — standalone container image.

## Google Technologies Utilized

- **Google Gemini API** (`gemini-2.5-flash`, via Google AI Studio) — powers the four AI agents:
  Triage, Routing, Resolution Verifier, and Insights (multimodal vision + structured JSON output).
- **Google Cloud Run** — hosts the containerized application (mandatory deployment target).
- **Google Cloud Build** — source-to-container builds for deployment.
- **Cloud Firestore** — primary datastore for issues, users/profiles, and cached insights.
- **Firebase Authentication** — Google sign-in and anonymous auth, with server-side ID-token
  verification via the Firebase Admin SDK.
- **Google Cloud Storage** — issue and resolution photos (private bucket, served via a proxy).

All services run within Google Cloud / Firebase **free / Always-Free tiers**.

## Agentic Depth & Innovation (evaluation highlights)

- **Agentic depth:** a multi-step pipeline of specialised agents that reason over multimodal
  input (Triage, Verifier), generate structured output (Routing, Insights), and use deterministic
  tools (dedup, aggregation, routing lookup). It makes autonomous decisions — auto-verifying at a
  confirmation threshold, confirming/rejecting a claimed fix from photographic evidence, and routing
  to the correct department — and surfaces every step to the user.
- **Innovation:** most civic apps stop at "report a pothole." CivicPulse **closes the loop** — the
  AI verifies that the fix actually happened from a photo and predicts where problems will recur —
  combined with community verification and a Community-Hero recognition system.
