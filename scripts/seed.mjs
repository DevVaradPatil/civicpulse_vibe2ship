// Seeds a realistic Delhi demo dataset (~30 issues) with category-matched
// before/after photos.
//
//   node scripts/seed.mjs            → refresh demo data
//   node scripts/seed.mjs --dry-run  → show what would change, touch nothing
//
// SAFETY: this script is NON-DESTRUCTIVE to real data. It only ever deletes
// documents it created itself (issues whose reporterId starts with "seed-", and
// user docs whose id starts with "seed-"). Real reports, real users, and their
// points are always preserved.
//
// Run with: node --env-file=.env.local scripts/seed.mjs   (needs scripts/seed-img/*.jpg)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { geohashForLocation } from "geofire-common";

const DRY_RUN = process.argv.includes("--dry-run");

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "media";
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run with:  node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const img = (name) => readFileSync(new URL(`./seed-img/${name}.jpg`, import.meta.url));
async function upload(path, name) {
  if (DRY_RUN) return;
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, img(name), { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
  if (error) throw new Error("upload " + path + " failed: " + error.message);
}

// Deterministic RNG for reproducible demo data.
let s = 1337;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));

const DAY = 86_400_000;
const SEED_PREFIX = "seed-";
const isSeedId = (v) => typeof v === "string" && v.startsWith(SEED_PREFIX);

const AREAS = [
  ["Connaught Place", 28.6315, 77.2167, 4],
  ["Karol Bagh", 28.6512, 77.1907, 3],
  ["Lajpat Nagar", 28.5677, 77.2433, 3],
  ["Saket", 28.5245, 77.2066, 2],
  ["Dwarka Sector 10", 28.5829, 77.0588, 3],
  ["Rohini", 28.7361, 77.117, 2],
  ["Chandni Chowk", 28.6562, 77.2301, 3],
  ["Hauz Khas", 28.5494, 77.2001, 2],
  ["Nehru Place", 28.5494, 77.2533, 2],
  ["Vasant Kunj", 28.52, 77.1591, 2],
  ["Janakpuri", 28.6219, 77.0878, 2],
  ["Mayur Vihar", 28.609, 77.292, 2],
];

const CATS = {
  pothole: ["Deep pothole", "Road crater", "Broken road surface", "Sunken patch"],
  water_leak: ["Burst water main", "Leaking pipeline", "Waterlogging", "Sewer overflow"],
  streetlight: ["Dark streetlight", "Flickering light", "Fallen light pole", "Broken streetlight"],
  waste: ["Garbage pile-up", "Overflowing bin", "Illegal dumping", "Uncollected waste"],
  other: ["Damaged footpath", "Broken railing", "Open manhole", "Fallen tree branch"],
};
const CAT_KEYS = Object.keys(CATS);
const STATUS_POOL = [
  ...Array(8).fill("reported"),
  ...Array(5).fill("verified"),
  ...Array(3).fill("in_progress"),
  ...Array(4).fill("resolved"),
];

const USERS = [
  ["seed-priya", "Priya Sharma"],
  ["seed-aarav", "Aarav Gupta"],
  ["seed-neha", "Neha Singh"],
  ["seed-rahul", "Rahul Verma"],
  ["seed-anjali", "Anjali Mehta"],
  ["seed-vikram", "Vikram Reddy"],
  ["seed-sara", "Sara Khan"],
  ["seed-dev", "Dev Patil"],
];

/** Deletes ONLY seed-created docs. Never touches real reports or users. */
async function purgeSeedData() {
  const { data: issues } = await db.from("issues").select("id, seed, reporter_id");
  const { data: users } = await db.from("users").select("uid, display_name");
  const allIssues = issues ?? [];
  const allUsers = users ?? [];

  const seedIssues = allIssues.filter((r) => r.seed === true || isSeedId(r.reporter_id));
  const seedUsers = allUsers.filter((r) => isSeedId(r.uid));

  console.log("  issues: " + seedIssues.length + " seed -> delete | " + (allIssues.length - seedIssues.length) + " real -> PRESERVED");
  console.log("  users : " + seedUsers.length + " seed -> delete | " + (allUsers.length - seedUsers.length) + " real -> PRESERVED");
  for (const u of allUsers.filter((r) => !isSeedId(r.uid))) {
    console.log("    preserving user: " + (u.display_name ?? "?") + " (" + String(u.uid).slice(0, 10) + ")");
  }

  if (DRY_RUN) return;

  if (seedIssues.length) {
    await db.from("issues").delete().in("id", seedIssues.map((r) => r.id));
  }
  if (seedUsers.length) {
    await db.from("users").delete().in("uid", seedUsers.map((r) => r.uid));
  }
  await db.from("meta").delete().eq("key", "insights");
}

async function main() {
  console.log(DRY_RUN ? "DRY RUN — nothing will be written\n" : "Seeding…\n");
  await purgeSeedData();
  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run without --dry-run to apply.");
    process.exit(0);
  }

  const tally = Object.fromEntries(USERS.map((u) => [u[0], { report: 0, resolve: 0 }]));
  let n = 0;
  let userIdx = 0;

  for (const [area, baseLat, baseLng, count] of AREAS) {
    for (let k = 0; k < count; k++) {
      n++;
      const category = CAT_KEYS[(n + k) % CAT_KEYS.length];
      const lat = baseLat + (rand() - 0.5) * 0.004;
      const lng = baseLng + (rand() - 0.5) * 0.004;
      const status = pick(STATUS_POOL);
      const severity = int(2, 5);
      const confirmations =
        status === "reported" ? int(0, 2) : status === "verified" ? int(3, 5) : int(3, 7);
      const daysAgo = int(0, 13);
      const createdAt = Date.now() - daysAgo * DAY;
      const title = `${pick(CATS[category])} near ${area}`;
      const reporter = USERS[userIdx++ % USERS.length];
      tally[reporter[0]].report++;

      const photoPath = `issues/seed-${n}.jpg`;
      await upload(photoPath, category);

      const doc = {
        seed: true,
        title,
        description: `${title}. Reported by a resident; needs attention from the local authority.`,
        category,
        severity,
        hazards: [],
        status,
        lat,
        lng,
        geohash: geohashForLocation([lat, lng]),
        photo_path: photoPath,
        confirmations,
        confirmed_by: [],
        reporter_id: reporter[0],
        reporter_name: reporter[1],
        ai_confidence: 0.85 + rand() * 0.13,
        created_at: createdAt,
        updated_at: createdAt,
      };

      if (status === "resolved") {
        const proofPath = `resolutions/seed-${n}.jpg`;
        // Category-matched "after" photo so the before/after slider makes sense.
        await upload(proofPath, `fixed_${category}`);
        doc.resolution = {
          proofPath,
          verified: true,
          verifiedAt: createdAt,
          note: "AI confirmed the issue is fixed in the after photo.",
        };
        tally[reporter[0]].resolve++;
      }
      const { error: insErr } = await db.from("issues").insert(doc);
      if (insErr) throw new Error("insert failed: " + insErr.message);
    }
  }

  for (const [uid, displayName] of USERS) {
    const t = tally[uid];
    const confirmCount = int(2, 9);
    const points = t.report * 10 + confirmCount * 5 + t.resolve * 20;
    await db.from("users").upsert({
      uid,
      display_name: displayName,
      points,
      report_count: t.report,
      confirm_count: confirmCount,
      resolve_count: t.resolve,
      updated_at: Date.now(),
    }, { onConflict: "uid" });
  }

  console.log(`\nSeeded ${n} issues and ${USERS.length} demo users. Real data untouched.`);
  process.exit(0);
}
main();
