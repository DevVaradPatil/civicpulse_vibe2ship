# CivicPulse — Presentation Brief (paste this into Claude to generate the deck)

**Instruction to Claude:** Create a **minimal, story-driven slide presentation** as a single
self-contained **16:9 HTML artifact** (arrow-key / click navigation, one slide per view).
This is for a **hackathon final-round pitch (~5 minutes, ~11 slides)**. Prioritize clarity and
visual restraint over density. Follow the design system below exactly. Where a slide says
`🖼️ IMAGE`, leave a clean, labeled placeholder box (dashed border, centered caption) that I can
drop a screenshot into — I will provide the images separately (see the list at the bottom).

---

## Design system (follow strictly)

- **Aesthetic:** minimal, modern, flat. **No gradients.** Solid colors, generous whitespace,
  strong typographic hierarchy. Think Linear / Vercel keynote, not corporate template.
- **Palette:** background `#FFFFFF`; text `#18181B`; muted `#6B7280`; hairlines `#E5E7EB`;
  **brand/accent `#2563EB`** (use sparingly for emphasis, one accent per slide).
  Severity accents if needed: green `#16A34A`, amber `#F59E0B`, red `#EF4444`.
- **Type:** a clean grotesque/sans (Inter or system UI). Big bold headlines, calm body text.
- **Layout:** lots of margin; ≤ ~20 words of body text per slide; never a wall of bullets.
- **Motion:** subtle only (fade/slide between slides). No spinning, no clutter.
- **Footer (every slide, small, muted):** `CivicPulse · Vibe2Ship Finals` + slide number.
- **Consistency:** a recurring small "pulse" mark (a simple activity/heartbeat glyph in brand
  blue) in the corner ties slides together.

---

## The narrative arc (the story)

Problem people feel → why existing tools fail → our idea → the AI that makes it real → proof it
works → who it empowers → how it's built → why it wins. Keep momentum; each slide earns the next.

---

## Slides

### 1 — Title
- **On slide:** `CivicPulse` (large). Tagline: **Report. Verify. Resolve.**
  One line under it: *Delhi's civic issues, closed-loop with AI + community.*
- Small: `Vibe2Ship Hackathon — Community Hero`.
- **🖼️ IMAGE (optional, right side):** the outlined Delhi issue map (`delhi_vector_map.png`).
- *Talking point:* "We built CivicPulse — where a single photo becomes a resolved civic action."

### 2 — The problem (make them feel it)
- **On slide (big):** *"You report a pothole. Then… silence."*
- Sub: Civic issues in our cities are reported into a void — fragmented, untracked, unaccountable.
- Optional 3 tiny icons: pothole · water leak · broken streetlight.
- *Talking point:* Everyone has done this. The report disappears; nothing changes; people stop trying.

### 3 — Why today's tools fall short
- **On slide:** *Every civic app stops at "report."*
- Three short lines (no fix verification · no routing · no foresight):
  - Nobody confirms the fix actually happened.
  - Reports don't reach the right authority.
  - No one predicts where the next problem will hit.
- *Talking point:* The loop is never closed — that's the real gap.

### 4 — Meet CivicPulse (the idea)
- **On slide (big):** *One photo. The AI and the community take it from there.*
- A simple horizontal **flow** (build it, no image needed), 5 nodes with arrows:
  **Report → Triage → Route → Verify → Resolve** (brand-blue nodes, hairline arrows).
- *Talking point:* A citizen snaps a photo; an AI agent pipeline does the heavy lifting; the
  community validates; the fix is verified.

### 5 — The engine: a multi-agent AI pipeline (our differentiator)
- **On slide title:** *Not one AI call — a pipeline of agents.*
- Show 5 compact cards in a row (build them; icons + one line each):
  1. **Triage** — reads the photo → category + severity *(Gemini vision)*
  2. **Dedup** — clusters nearby duplicate reports *(deterministic)*
  3. **Routing** — drafts the complaint to the right authority *(Gemini)*
  4. **Verifier** — confirms the fix from an after-photo *(Gemini vision)*
  5. **Insights** — predicts hotspots & trends *(Gemini)*
- Caption: *Minimal-AI by design — Gemini only where judgment is needed; everything else is
  deterministic code.*
- *Talking point:* This is our agentic depth — specialised agents that reason and use tools.
- **🖼️ IMAGE (optional, small, below):** the "AI agent pipeline" panel from an issue page.

### 6 — See it work: report → instant AI triage
- **On slide:** *Snap it. AI classifies it in seconds.*
- **🖼️ IMAGE (primary):** report flow screenshot showing the AI triage result
  (category + severity + confidence).
- *Talking point:* No forms to fill — the Triage agent fills them from the photo.

### 7 — The innovation: AI verifies the fix ⭐ (the wow moment)
- **On slide (big):** *We don't just report it — AI confirms it's actually fixed.*
- **🖼️ IMAGE (primary, large):** the **before/after slider** on a resolved issue.
- Sub: The Resolution Verifier compares the "before" and "after" photos and closes the loop.
- *Talking point:* This is what nobody else does — proof of resolution, not just a status toggle.

### 8 — From citizens to Community Heroes
- **On slide:** *Participation people actually want to do.*
- Three short beats: community confirmations · points, badges & tiers *(Civic Rookie →
  Community Hero)* · public profiles & leaderboard.
- **🖼️ IMAGE (primary):** leaderboard (podium) screenshot.
- *Talking point:* Gamified civic engagement — recognition turns bystanders into heroes.

### 9 — Predicts the next problem
- **On slide:** *From reactive to predictive.*
- Sub: A live impact dashboard surfaces resolution rates, trends, and AI-predicted **hotspots**.
- **🖼️ IMAGE (primary):** dashboard screenshot (charts + the AI insights widget open).
- *Talking point:* The Insights agent tells the city where to act *before* problems escalate
  (e.g., pre-monsoon waterlogging zones).

### 10 — Built to ship (tech + Google stack)
- **On slide title:** *Production-ready, and 100% on free tiers.*
- A clean **architecture strip** (build it, no image): 
  `Next.js on Cloud Run` → `Gemini 2.5-flash` · `Firestore` · `Firebase Auth` · `Cloud Storage`.
- Small line: One container, deployed on **Google Cloud Run**. Maps via Leaflet + OpenStreetMap.
- Badges/tags: `Gemini API` `Cloud Run` `Firestore` `Firebase Auth` `Cloud Storage` `Cloud Build`.
- *Talking point:* Deployed, live, and free — no paid tiers anywhere.

### 11 — Close (impact + call to action)
- **On slide (big):** *CivicPulse — Report. Verify. Resolve.*
- One line: *Transparency, accountability, and foresight for civic issues — powered by AI.*
- **Live:** `https://civicpulse-245651121772.us-central1.run.app`
- **Code:** `github.com/DevVaradPatil/civicpulse_vibe2ship`
- **🖼️ IMAGE (optional):** a QR code to the live app (or leave a placeholder box labeled "QR").
- *Talking point:* Thank you — try it live, right now, on your phone.

---

## 📸 IMAGES TO SHARE INTO THE CHAT (when generating the deck)

Capture these from the **live app** and paste them into the chat alongside this brief so Claude
can place them. Take app screenshots on a **phone (or a narrow browser ~400px)** unless noted —
they look crisp and on-brand. **Warm the site first (open it once) so nothing is loading.**

**Essential (5) — the deck lands without these being perfect, but they make it real:**
1. **`delhi_vector_map.png`** — already in the repo's `public/` folder (title/idea slides).
2. **Report → AI triage result** — go to *Report*, upload a clear pothole/garbage photo, and
   screenshot the AI result card (category + severity + confidence). → Slide 6
3. **Before/after slider** — open a **resolved** issue and screenshot the before/after slider. → Slide 7
4. **Dashboard** — screenshot the dashboard with the **AI insights** widget open (charts visible). → Slide 9
5. **Leaderboard** — screenshot the podium (top-3). → Slide 8

**Optional (nice to have):**
6. **Agent pipeline panel** — from any issue page, the "AI agent pipeline" section. → Slide 5
7. **Map** — the map view showing clustered markers. → Slide 4 or 10
8. **QR code** — generate one pointing to the live URL for the closing slide.

> Everything else in the deck (flow diagram on slide 4, agent cards on slide 5, architecture
> strip on slide 10) should be **built in HTML/CSS**, not images — keep it flat and on-brand.

---

## Tone & delivery notes (for the presenter, not the slides)
- Lead with the **story and the problem**, not the tech. Earn the tech slide.
- The **⭐ money moment is Slide 7** (AI verifies the fix) — slow down there; drag the slider live
  if you can.
- Keep spoken lines short; let the slides breathe.
