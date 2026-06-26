# Vibe2Ship — Community Hero (Hyperlocal Problem Solver)

> **Status:** PLAN — awaiting user "GO" before any building begins.
> **Hard constraint:** 100% FREE services only. No paid tiers. Stay strictly within Always-Free / free-tier limits.

---

## 1. Context & Constraints

| Item | Detail |
|---|---|
| Hackathon | Vibe2Ship (BlockseBlock platform) |
| Chosen problem | **PS-2: Community Hero — Hyperlocal Problem Solver** |
| Build window | 22 Jun 3 PM → **29 Jun 2026, 2:00 PM** (hard deadline, no late entries) |
| Time left (from 25 Jun) | ~3.5 working days |
| Mandatory deploy | **Google Cloud** (publicly accessible, live through evaluation) |
| Required submissions | (1) Deployed app link on Google Cloud, (2) GitHub repo, (3) Project Description Google Doc |
| Project Doc must cover | Problem Statement Selected, Solution Overview, Key Features, Technologies Used, Google Technologies Utilized |

### Evaluation Matrix (design every decision around this)
| Criteria | Weight | Our lever |
|---|---|---|
| Problem Solving & Impact | 20% | Real civic pain (potholes/leaks/streetlights/waste); closed accountability loop |
| **Agentic Depth** | **20%** | Multi-agent pipeline (triage → dedup → route → verify → predict). **Biggest differentiator.** |
| Innovation & Creativity | 20% | AI *verifies the fix* from a resolution photo; auto-clusters duplicates; auto-drafts authority complaint |
| Usage of Google Technologies | 15% | Gemini (multimodal), Firebase, Cloud Run, GCS, Firestore |
| Product Experience & Design | 10% | Mobile-first PWA, polished, fast |
| Technical Implementation | 10% | Clean container, server-side AI, sound data model |
| Completeness & Usability | 5% | End-to-end working flow + seed data + demo script |

---

## 2. Product Vision

**One-liner:** A citizen reports a civic issue with one photo; an AI agent pipeline categorizes it, rates severity, removes duplicates, drafts the complaint to the right authority, tracks it to resolution, verifies the fix from a photo, and surfaces predictive hotspots on a public impact dashboard.

**The differentiating story (innovation + agentic depth):** Other civic apps stop at "report a pothole." We close the loop — the AI does the triage, the routing, *and the verification that it was actually fixed* — plus it learns where problems recur.

**Working name (TBD with user):** `CivicPulse` / `FixHero` / `Nagrik` — pick at GO.

---

## 3. Architecture (all free-tier)

```
[ Next.js PWA (App Router, TS, Tailwind) ]   ← one app, frontend + backend
   │  client components  │  route handlers / server actions (server-side)
   ▼                     ▼
 UI / Leaflet map     [ Gemini API (AI Studio free tier) ]  multimodal + text
                      [ Firebase Admin SDK ] ──► Firestore (issues, clusters, users)
                      [ GCS bucket ] ──► issue + proof photos
        │  deployed as ONE container on Cloud Run
        ▼
[ Firebase Auth ]  Google sign-in + Anonymous (client-side)
[ Leaflet + OpenStreetMap ]  map tiles (no key, no billing)
[ Browser Geolocation API ]  capture report location
```

### Why this stack stays free
- **Next.js on Cloud Run** — Always-Free 2M req/mo. **One** container holds frontend + server logic (route handlers), so there is **no separate backend to host**. Gemini key stays server-side. **Satisfies "deploy on Google Cloud."** (Avoid Firebase App Hosting for Next.js — it forces the paid Blaze plan.)
- **Firestore** — Firebase Spark free tier (no card needed for DB).
- **Firebase Auth** — free on Spark.
- **Google Cloud Storage** — Always-Free 5 GB-months in us-central1/us-east1/us-west1 (use one of these regions). Accessed server-side via service account.
- **Gemini API** — AI Studio free tier (`gemini-2.0-flash` for vision + reasoning). Key stays **server-side only**.
- **Maps** — Leaflet + OpenStreetMap = zero cost, no API key, avoids Google Maps billing requirement. (We still score Google-tech via Gemini/Firebase/Cloud Run/GCS.)

> ⚠️ **Billing-account note:** Deploying to Cloud Run requires a GCP project with a billing account *attached* (card on file), but usage stays **$0** within Always-Free limits. Firebase Storage / Cloud Functions are intentionally avoided because new projects now push them onto the Blaze (pay-as-you-go) plan — we use **GCS Always-Free** + an **Express server** instead, so we never need Blaze.

### Key design choices
- All Gemini + Firestore + GCS access is **server-side** (Next.js route handlers + Firebase Admin SDK + service account). Client components only call our own `/api/*` routes → no exposed keys, simpler security rules.
- **Minimal-AI principle:** Gemini is used *only* where it creates real value (perception/judgment); deterministic code handles everything else. See agent table in §4. Keeps us inside the free tier without weakening agentic depth.
- Images compressed client-side (< ~500 KB) before upload to keep within free storage/bandwidth.
- Mobile-first PWA so it demos great on a phone.

---

## 4. The Agentic System (the 20% centerpiece)

A server-side **Civic Agent orchestrator** chaining 5 specialized agents/tools. Per the minimal-AI principle, Gemini fires only at perception/judgment nodes; the rest are deterministic tools the agent uses.

1. **Triage Agent** — 🤖 **Gemini (multimodal, essential)**. Input: photo (+ optional voice/text). Output JSON: `{category, subcategory, severity 1-5, hazard_flags, title, description, confidence}`. *The wow moment.*
2. **Geo-Dedup Agent** — ⚙️ **pure code, no Gemini**. Geohash + radius + same-category proximity → attach as a **confirmation** to an existing cluster or create new. Autonomous decision via deterministic logic (a tool the agent calls).
3. **Routing Agent** — ⚙️ category→department from a config map; 🤖 **Gemini text, on-demand only** (fires when user clicks "draft complaint") to write the formal complaint letter + priority + SLA estimate. Rare calls.
4. **Resolution Verifier Agent** — 🤖 **Gemini (multimodal, essential)**. On "mark resolved + proof photo", compares before/after semantics → confirms or rejects. *The innovation centerpiece — closes the loop.*
5. **Insights Agent** — 🤖 **Gemini text, on-demand + cached** in Firestore (generated once, re-read cheaply). Hotspot detection, trends, **predictive warnings** ("Ward 4 recurring waterlogging — pre-monsoon risk"). Powers the dashboard. Near-zero call volume.

**Gemini call budget:** 2 essential multimodal calls in the core loop (Triage, Verifier) + 2 user-triggered/cached text calls (Routing, Insights). Comfortably within `gemini-2.0-flash` free-tier limits. Each agent is a discrete, demonstrable step — easy to show judges the "agentic chain."

---

## 5. Feature Set

### MVP (must ship)
- [x] Auth: **Firebase Auth — Google sign-in + Anonymous** ✅ (server-verified ID tokens; profiles, tiers, badges).
- [x] **Report flow:** capture/upload photo → geolocation → Triage Agent auto-fills category/severity/title → submit. ✅
- [x] **Map view** (Leaflet): issues as severity-colored markers; click → detail. ✅
- [x] **List/feed view** (side list on map). ✅ (filters TBD)
- [x] **Issue detail:** photo, AI category + severity, location, status, confirmations. ✅
- [x] **Status lifecycle:** Reported → Verified → In Progress → Resolved. ✅
- [x] **Community verification:** confirm/upvote; mark resolved + proof photo → Resolution Verifier Agent. ✅
- [x] **Impact dashboard:** counts by category/status, resolution rate, hotspots, AI insight summary + predictive insights. ✅
- [x] **Gamification (light):** points for report/confirm/verified-resolution + leaderboard. ✅

### Stretch (only if time)
- [ ] Voice input via Web Speech API (free, browser-native).
- [ ] Geo-Dedup Agent live duplicate clustering.
- [ ] Routing Agent: auto-drafted complaint + "copy/share to authority".
- [ ] Predictive Insights Agent (scheduled refresh).
- [ ] Badges + ward leaderboards.
- [ ] Installable PWA (offline shell).

---

## 6. Data Model (Firestore)

- `issues/{id}`: `title, description, category, subcategory, severity, status, lat, lng, geohash, photoUrl, reporterId, clusterId, confirmations, createdAt, updatedAt, resolution:{proofUrl, verified, verifiedAt}`
- `clusters/{id}`: `category, centroidLat, centroidLng, issueIds[], openCount`
- `users/{id}`: `displayName, points, badges[], reportCount, confirmCount`
- `insights/{wardOrGlobal}`: `summary, hotspots[], predictions[], generatedAt`

---

## 7. Build Phases (timeline → 29 Jun 2 PM)

**Phase 1 — Scaffold & de-risk deploy (FIRST priority)**
- Vite+React+TS+Tailwind frontend; Express+TS backend; single Dockerfile.
- Create GCP project, GCS bucket, Firebase project (Firestore + Auth), Gemini API key.
- **Deploy a "hello world" to Cloud Run on day 1** to prove the pipeline before features.

**Phase 2 — Core report loop**
- Photo upload → GCS; Triage Agent; persist to Firestore; map + list + detail views.

**Phase 3 — Community & tracking**
- Confirm/upvote, status lifecycle, resolution + Verifier Agent, gamification points/leaderboard.

**Phase 4 — Intelligence & dashboard**
- Impact dashboard; Insights Agent; (stretch) Dedup + Routing/complaint agents.

**Phase 5 — Polish & submit**
- Design polish, mobile/PWA, seed demo data, README, **Project Description Google Doc**, final Cloud Run deploy, rehearse demo script. Buffer before 2 PM cutoff.

---

## 8. Submission Checklist
- [x] Live Cloud Run URL (public): https://civicpulse-245651121772.us-central1.run.app
- [x] Public GitHub repo with code + README: https://github.com/DevVaradPatil/civicpulse_vibe2ship
- [x] Project Description content drafted → `SUBMISSION.md` (paste into a public Google Doc).
- [ ] Create the Google Doc from `SUBMISSION.md` and set "anyone with the link" access.
- [ ] Submit via BlockseBlock dashboard → Create Project → links → Final Submit (irreversible — only when fully satisfied).

## 9. Demo Narrative (for judges)
Report a pothole by photo on a phone → watch AI auto-classify + rate severity → see it on the map → another user confirms it → mark resolved with a fix photo → AI verifies the fix → dashboard shows the resolved count tick up + a predictive hotspot insight. End-to-end agentic loop in 90 seconds.

## 10. Decisions (FINAL — GO given)
- [x] **Name → CivicPulse**
- [x] **Backend** → Next.js (App Router) full-stack, single Cloud Run container. No separate backend.
- [x] **AI scope** → Minimal-AI: Gemini only for Triage + Resolution Verifier (multimodal) + on-demand/cached Routing & Insights text. Rest deterministic.
- [x] **Auth** → Firebase Auth (Google sign-in + Anonymous).
- [x] **Demo city** → **Delhi** (seed data around Delhi wards/landmarks).
- [x] **GCP billing** → card OK as long as usage stays $0 within Always-Free.

## 11. UI / Design Guidelines (apply from the start)
**Direction:** minimal yet modern. **No gradients. Flat, solid colors only.** Generous whitespace, clear hierarchy, fast.
- **Type:** Geist / Inter. Few sizes, strong weight contrast.
- **Surfaces:** white bg `#FFFFFF`, muted surface `#F7F7F8`, 1px borders `#E5E7EB`, modest radius (`rounded-lg`), minimal shadow (no heavy drop shadows).
- **Text:** `#18181B` primary, `#6B7280` muted.
- **Brand/primary (CTA, accents):** solid civic blue `#2563EB`.
- **Severity (solid chips):** low `#16A34A`, medium `#F59E0B`, high `#EF4444`, critical `#B91C1C`.
- **Status (solid chips):** Reported gray `#6B7280`, Verified blue `#2563EB`, In Progress amber `#F59E0B`, Resolved green `#16A34A`.
- Mobile-first. Buttons/inputs flat with solid fills, no gradient. Icons: lucide-react (line icons).
