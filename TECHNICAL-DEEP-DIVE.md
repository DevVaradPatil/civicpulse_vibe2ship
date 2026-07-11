# CivicPulse — Technical Deep-Dive & Q&A Prep

Everything you need to defend the project in the final round. Skim the **Cheat-Sheet** first,
then read the sections, then rehearse the **Anticipated Q&A** at the end.

- **Live:** https://civicpulse-245651121772.us-central1.run.app
- **Repo:** https://github.com/DevVaradPatil/civicpulse_vibe2ship
- **Problem statement:** PS-2 Community Hero — Hyperlocal Problem Solver (demo scope: Delhi)

---

## 0. Cheat-sheet (memorize these)

- **One-liner:** A photo becomes a tracked, AI-verified, resolved civic action — closing the loop
  that other reporting apps leave open.
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4, on **Google Cloud Run**
  (one Docker container, full-stack — no separate backend).
- **AI:** **Gemini 2.5-flash** (server-side only) as **4 agents** — Triage, Routing, Verifier,
  Insights — plus a deterministic Dedup step.
- **Google tech:** Gemini API, Cloud Run, Cloud Build, Cloud Firestore, Firebase Auth, Cloud Storage.
- **Data:** Firestore (`issues`, `users`, `meta/insights`), photos in a **private** GCS bucket.
- **Auth:** Firebase Auth (Google + Anonymous); **server verifies ID tokens** on all mutations.
- **Cost:** **₹0** — everything runs inside Always-Free / free tiers.
- **The differentiator:** the **AI verifies the fix** from an after-photo, and **predicts hotspots**.

---

## 1. Architecture

```
                       ┌─────────────────────────────────────────────┐
   Browser (PWA)  ───► │  Next.js 16 app  (ONE Cloud Run container)   │
   React client        │                                              │
   Firebase Auth SDK    │  Client Components         Route Handlers    │
   Leaflet map          │  (UI, map, forms)   ─────► (/api/*, server)  │
                        │                              │               │
                        └──────────────────────────────┼──────────────┘
                                                        │  (server-side only)
                        ┌───────────────┬───────────────┼───────────────┬─────────────┐
                        ▼               ▼               ▼               ▼             ▼
                   Gemini API      Firestore     Cloud Storage    Firebase Auth   Leaflet/OSM
                 (4 AI agents)  (Admin SDK)   (private bucket,   (verify ID       (tiles,
                                              via /api/media)     tokens)          no key)
```

**Key architectural choice:** a **single full-stack Next.js container**. Client components render
the UI; **route handlers** (`src/app/api/*`) run all privileged logic (Gemini calls, Firestore
Admin SDK, GCS, token verification). The browser only ever calls our own `/api/*` — **no API keys
or Admin credentials ever reach the client.**

### End-to-end request lifecycle (a report)
1. User picks a photo → **compressed client-side** (`<canvas>`, max 1280px, JPEG q0.8) to keep
   uploads small.
2. `POST /api/triage` with the base64 image → **Triage agent** (Gemini) returns structured JSON.
3. UI shows the AI result; user can override category, adds an optional name.
4. `POST /api/issues` (with the Firebase ID token in the `Authorization` header) →
   - server **verifies the token** → trusted `reporterId`,
   - uploads the photo to the **private GCS bucket**,
   - computes a **geohash**, writes the Firestore doc,
   - **awards +10 points** to the user (atomic increment).
5. Photos are later read back through `/api/media/<path>` (a server proxy that streams from the
   private bucket — the bucket is never public).

---

## 2. The AI agent system (the core of "agentic depth")

**Model:** `gemini-2.5-flash` for everything (multimodal + text). All calls go through one
resilient wrapper `generate()` in `src/lib/server/gemini.ts` that **retries with backoff** on
transient `503 (overloaded)` / `429 (rate-limited)` errors. Every agent uses Gemini's
**structured output** (`responseMimeType: application/json` + a `responseSchema`), so we never
parse free-text — the model returns typed JSON we validate and clamp.

| Agent | File | Modality | Input → Output |
|---|---|---|---|
| **Triage** | `agents/triage.ts` | vision | photo (+ optional category hint) → `{isCivicIssue, category, severity 1-5, title, description, hazards[], confidence}` |
| **Dedup** | `server/issues.ts` | **none (code)** | lat/lng/category → count of same-category issues within 250 m (geohash + `distanceBetween`) |
| **Routing** | `agents/routing.ts` | text | issue fields + authority → `{subject, body, priority, slaEstimate}` formal complaint |
| **Resolution Verifier** | `agents/verifier.ts` | vision | before + after photos + category/title → `{resolved, confidence, note}` |
| **Insights** | `agents/insights.ts` | text | aggregate stats + hotspots → `{summary, predictions[]}` |

**Why this is genuinely "agentic," not a single prompt:**
- It's a **multi-step pipeline** where each agent has a narrow responsibility and the output of one
  informs the next (triage → dedup → routing → verify → insights).
- Agents **use tools** (Firestore queries, geospatial math, aggregation) and **make autonomous
  decisions**: auto-verifying an issue at a confirmation threshold, **accepting/rejecting a claimed
  fix from photographic evidence**, and routing to the correct department.
- It's **transparent** — every issue page renders the pipeline with each agent's status + reasoning.

**Minimal-AI principle (important talking point):** Gemini is used *only* where judgment/perception
is required. Deduplication, statistics, hotspot clustering, and authority lookup are **deterministic
code**. This keeps the system fast, cheap, predictable, and inside the free tier — and it's *better
engineering* than routing everything through an LLM.

**Cost control:** Triage + Verify are the only calls in the core loop; Routing is on-demand (user
clicks "Draft complaint"); Insights are **cached** (Firestore 30 min + client localStorage 5 min).

---

## 3. Data model (Cloud Firestore)

**`issues/{id}`**
```
title, description, category, severity(1-5), hazards[], status,
lat, lng, geohash, photoPath,                     // GCS object path (served via /api/media)
confirmations, confirmedBy[],                     // idempotent confirm; drives "Confirmed by you"
reporterId, reporterName, aiConfidence,
resolution?: { proofPath, verified, verifiedAt, note },   // set by the Verifier agent
routing?:   { subject, body, priority, slaEstimate, department, generatedAt },  // cached complaint
seed?: boolean,                                   // marks demo data (safe re-seeding)
createdAt, updatedAt
```

**`users/{uid}`** — `displayName, photoURL, points, reportCount, confirmCount, resolveCount, updatedAt`

**`meta/insights`** — `summary, predictions[], generatedAt` (a **cache** of the Insights agent output)

Points use Firestore **atomic `FieldValue.increment`** so concurrent updates are safe. Confirmations
use a **Firestore transaction** so the count and `confirmedBy` array stay consistent and one user
can only confirm once.

---

## 4. Auth & identity (Firebase Auth)

- **Providers:** Google sign-in + **Anonymous** (auto). On load, the app **signs in anonymously**
  so every visitor has a stable `uid` and can participate instantly; "Sign in with Google" upgrades
  to a real identity.
- **Client:** `AuthProvider` calls `ensureFirebase()`, which **fetches the web config at runtime**
  from `/api/firebase-config` and lazily initializes Firebase. `authedFetch()` attaches the Firebase
  **ID token** (`Authorization: Bearer …`) to every mutating request.
- **Server:** `getUserFromRequest()` (`server/auth.ts`) **verifies the ID token** with the Firebase
  Admin SDK on report / confirm / resolve. So attribution and points **can't be spoofed** — the
  client can't just claim to be someone.
- **Profiles:** `/profile` (yours, editable name) and `/u/[uid]` (public) with tier, badges, points,
  and report history.

---

## 5. Storage & media

- Photos live in a **private** Google Cloud Storage bucket. Nothing is public.
- They're served through a **proxy route** `/api/media/[...path]` that streams the object from GCS
  using the server's credentials — so we get access control without a public bucket.
- **Client-side compression** (canvas) shrinks images before upload → less bandwidth/storage, faster
  triage (smaller payload to Gemini).

---

## 6. Status lifecycle & gamification

**Lifecycle:** `Reported → Verified → In Progress → Resolved`
- **Reported → Verified:** automatic at **3 community confirmations** (idempotent per user).
- **Verified → In Progress:** manual action (simulates an authority picking it up).
- **→ Resolved:** only when someone uploads an after-photo and the **Verifier agent confirms** the
  fix. If the AI can't confirm it, status does **not** advance (strict).

**Points:** report **+10**, confirm **+5**, verified resolution **+20**.
**Tiers:** Civic Rookie (0) → Active Citizen (20) → Street Guardian (50) → **Community Hero** (100).
**Badges:** First Report, Eyes on the Street (10 reports), Watchdog (5 confirms), Fixer (1 fix),
Loop Closer (5 fixes).

---

## 7. Dashboard, hotspots & insights

- **Stats** are computed deterministically from all issues (status/category/severity breakdowns,
  resolution rate, a 7-day daily trend).
- **Hotspots:** issues are grouped by a **geohash prefix (precision 6, ~1.2 km cells)**; any cell
  with ≥ 2 issues is a hotspot, with a centroid and dominant category. Pure code, no AI.
- **Insights agent** turns those aggregates + hotspots into a natural-language summary + predictive
  warnings (e.g., pre-monsoon waterlogging, festival waste). **Cached** server-side (30 min) and in
  the browser (localStorage, 5 min); the floating widget auto-runs on dashboard load.
- **Charts** are hand-built **flat SVG** (donut, area, bars) themed with our CSS variables — no chart
  library, full control, on-brand, and they adapt to dark mode.

---

## 8. Tech stack & why

| Choice | Why |
|---|---|
| **Next.js 16 (App Router)** | One codebase for UI + server; route handlers keep secrets server-side; standalone output → tiny container. No separate backend to run. |
| **React 19 + TypeScript** | Type safety across the domain model (`lib/domain.ts`, `lib/types.ts`). |
| **Tailwind v4** | Design tokens in CSS `@theme`; flat, consistent, dark-mode via variable overrides. |
| **Gemini 2.5-flash** | Fast, cheap, multimodal, structured output. (2.0-flash is **zeroed on the free tier** — a real gotcha we hit and fixed.) |
| **Firestore** | Serverless, real-time-capable, generous free tier, atomic increments/transactions. |
| **Cloud Storage** | Cheap durable blob storage; Always-Free 5 GB. |
| **Firebase Auth** | Drop-in Google + anonymous; Admin SDK verifies tokens. |
| **Leaflet + OpenStreetMap** | **Zero-cost, no API key, no billing account** for maps (Google Maps Platform requires billing). |
| **Cloud Run** | Mandatory Google Cloud target; scales to zero (free when idle); one container. |

---

## 9. Deployment & infrastructure

- **Build:** `gcloud run deploy --source .` → **Cloud Build** builds our `Dockerfile`
  (multi-stage, Next.js **standalone** output → small `node:22-alpine` runtime image) → deploys to
  Cloud Run.
- **Credentials (no key files):** Firestore & GCS use **Application Default Credentials** — the
  **runtime service account** on Cloud Run, and `gcloud auth application-default login` locally. No
  service-account JSON is committed.
- **Config split (security):**
  - **Server secrets** (`GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`, `GCS_BUCKET`) → Cloud Run **runtime
    env vars**.
  - **Firebase web config** (public by design, but we still keep it out of the repo/image) → served
    at **runtime** from `/api/firebase-config` (`FIREBASE_WEB_*` env). The client fetches it and
    initializes Firebase — so it's **not baked into the JS bundle or committed**.
- **IAM (one-time):** the Compute Engine default SA was granted `cloudbuild.builds.builder` (new GCP
  projects no longer auto-grant this), plus `datastore.user` and `storage.objectAdmin`.
- **Scaling:** `min-instances=0` (free when idle, ~7-8 s cold start), `max-instances=3`, 1 vCPU /
  1 GiB. Cloud Run autoscales on request concurrency.

---

## 10. Free-tier / cost strategy (a likely question)

Everything is inside **Always-Free / free tiers**:
- **Cloud Run:** 2M requests/month free; scales to zero.
- **Firestore:** Spark free tier (reads/writes/storage well under limits at demo scale).
- **Cloud Storage:** Always-Free 5 GB (images compressed client-side).
- **Gemini:** free tier (2.5-flash), and we minimize calls (2 in the core loop + cached insights).
- **Maps:** Leaflet + OpenStreetMap — no billing at all.
- We deliberately **avoid Firebase Cloud Functions / Firebase Storage**, which push new projects
  onto the paid Blaze plan; instead we use an Express-free Next.js server + a GCS Always-Free bucket.
- *Caveat we're honest about:* Cloud Run/GCS require a **billing account attached** (a card), but
  usage stays **₹0** within Always-Free.

---

## 11. Security

- Secrets are **server-side only**; the browser talks only to `/api/*`.
- All mutations **verify the Firebase ID token** → no spoofed identity/points.
- GCS bucket is **private**; media is proxied, not publicly listed.
- The **Firebase web API key is public by design** (it ships in every web app's client) — protection
  comes from **Auth authorized domains + Firestore rules + optional API-key referrer restrictions**,
  not from hiding it. We still moved it out of the repo/bundle to runtime config.
- Input is validated/clamped server-side (severity clamped 1-5, category whitelisted, sizes capped).

---

## 12. Scalability & performance

- **Stateless container** → Cloud Run scales horizontally on demand; Firestore and GCS scale
  independently.
- **Geohash** indexing makes "nearby" dedup/hotspot queries efficient (no full scans at scale — you'd
  add geohash range queries).
- **Caching** (insights) and **client-side compression** cut cost and latency.
- Cold start (~7-8 s) is the main demo caveat — mitigated by warming the instance before presenting.

---

## 13. Key design decisions & trade-offs

- **Minimal-AI over "AI everything":** deterministic where possible → cheaper, faster, more reliable,
  and genuinely agentic.
- **Single Next.js container over a separate backend:** simpler to deploy/scale for a hackathon;
  route handlers keep secrets safe.
- **Anonymous-first over forced login:** lower friction (anyone can report instantly); Google
  sign-in is an upgrade for recognition.
- **Private bucket + proxy over public bucket:** access control and no accidental public exposure.
- **Custom SVG charts over a chart library:** smaller bundle, full control of the flat aesthetic,
  dark-mode aware.
- **OSM/Leaflet over Google Maps:** stays 100% free (no billing), while Google-tech credit comes from
  Gemini/Firebase/Cloud Run/Storage.
- **Runtime Firebase config over build-time inlining:** keeps the key out of the repo and bundle.

---

## 14. Known limitations & future work (say these before they ask)

- **AI verification isn't foolproof** — a user could upload an unrelated "after" photo; the Verifier
  is strict but not perfect. Future: geo/EXIF checks, multi-confirmer sign-off, human review queue.
- **No real government integration yet** — we *draft* the complaint; next step is email/API delivery
  to civic bodies and status callbacks.
- **Trust/abuse:** add rate limiting, report-spam detection, and reputation weighting.
- **Cold start** on free tier; production would use min-instances ≥ 1 (paid) or Cloud Run CPU-always.
- **Localization** (Hindi/regional languages), **offline PWA**, **video** reporting, and **push
  notifications** are natural extensions.

---

## 15. Anticipated Q&A (rehearse these)

**Product / impact**
- *"How is this different from existing civic apps (e.g., existing complaint portals)?"* → They stop
  at "report." We **close the loop**: AI triages, routes, and **verifies the actual fix** from a
  photo, and **predicts** where problems recur. Plus gamified community verification.
- *"What stops fake or spam reports?"* → Verified identity (token), one-confirm-per-user, AI civic-
  check (`isCivicIssue`), and dedup. Roadmap: rate limiting + reputation.
- *"Who resolves the issue — you don't fix potholes?"* → Correct; we're the transparency + routing +
  verification layer. We generate the authority complaint and prove resolution; civic bodies act.

**AI / agentic**
- *"Why is this 'agentic' and not just prompts?"* → Multi-step pipeline of specialised agents that
  use tools and make autonomous decisions (auto-verify threshold, accept/reject a fix from evidence,
  route to a department), with each step visible.
- *"How does fix-verification actually work? Can it be fooled?"* → Gemini compares before/after
  photos with a strict prompt; only advances to Resolved if clearly fixed. Not foolproof — see
  roadmap (EXIF/geo, multi-sign-off).
- *"What if Gemini is rate-limited or down?"* → `generate()` retries with backoff on 503/429; UI
  degrades gracefully; deterministic parts (dedup/stats/hotspots) still work. Insights are cached.
- *"Why gemini-2.5-flash?"* → Multimodal, fast, cheap, structured output, and it's live on the free
  tier (2.0-flash is zeroed there).
- *"How accurate is triage/severity?"* → It returns a confidence score and the user can override the
  category before submitting — human-in-the-loop.

**Technical / infra**
- *"Why Next.js and not a separate backend?"* → One container, route handlers keep secrets server-
  side, standalone output → tiny image, simplest to deploy on Cloud Run.
- *"Why Firestore over SQL?"* → Serverless, generous free tier, atomic increments/transactions,
  scales to zero; our access patterns are document-oriented.
- *"Where do photos go / how are they secured?"* → Private GCS bucket, streamed via `/api/media`; no
  public access.
- *"How do you authenticate the backend to Google Cloud?"* → Application Default Credentials — the
  Cloud Run runtime service account; no key files.
- *"How is the API key protected?"* → Gemini key is server-side env, never sent to the client. The
  Firebase web key is public by design and restricted via authorized domains + rules.

**Business / scale / cost**
- *"What does it cost to run?"* → ₹0 today — all free tiers. At scale, Cloud Run + Firestore +
  Gemini are pay-as-you-go and cheap per request; we'd add caching and batch insights.
- *"Can it scale to a whole city / multiple cities?"* → Yes — stateless Cloud Run autoscaling,
  Firestore + geohash queries; `Delhi` config is a single source we'd parameterize per city.
- *"How long did this take / team size?"* → (your answer — timeline + who did what.)

**Design**
- *"Why the flat, no-gradient look?"* → A deliberate minimal design system (tokens in Tailwind
  `@theme`), consistent light/dark, mobile-first — clarity over decoration.

---

## 16. 30-second technical summary (if they ask "explain the architecture")

"It's a single full-stack **Next.js** app on **Google Cloud Run**. The browser only calls our own
API routes, which run everything privileged server-side: **four Gemini 2.5-flash agents** — Triage,
Routing, Verifier, Insights — plus deterministic dedup and stats. Data is in **Firestore**, photos in
a **private Cloud Storage** bucket served through a proxy, and identity is **Firebase Auth** with
server-side token verification. The whole thing runs on **free tiers**, and the standout is that the
**AI verifies the actual fix from an after-photo** and **predicts hotspots** — closing the civic loop
end-to-end."
