// Seeds a realistic Delhi demo dataset (~30 issues). Usage: node scripts/seed.mjs
// Requires ADC (`gcloud auth application-default login`) and scripts/seed-img/*.jpg.
import { readFileSync } from "node:fs";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Storage } from "@google-cloud/storage";
import { geohashForLocation } from "geofire-common";

const projectId = process.env.FIREBASE_PROJECT_ID || "civicpulse-v2s-01";
const bucketName = process.env.GCS_BUCKET || "civicpulse-v2s-01-media";
if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const bucket = new Storage().bucket(bucketName);

const img = (name) => readFileSync(new URL(`./seed-img/${name}.jpg`, import.meta.url));
async function upload(path, name) {
  await bucket.file(path).save(img(name), {
    contentType: "image/jpeg",
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
}

// Deterministic RNG for reproducible demo data.
let s = 1337;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));

const DAY = 86_400_000;

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

async function main() {
  for (const col of ["issues", "users", "meta"]) {
    const snap = await db.collection(col).get();
    const b = db.batch();
    snap.docs.forEach((d) => b.delete(d.ref));
    await b.commit();
  }

  const tally = Object.fromEntries(
    USERS.map((u) => [u[0], { report: 0, confirm: 0, resolve: 0 }]),
  );
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
        title,
        description: `${title}. Reported by a resident; needs attention from the local authority.`,
        category,
        severity,
        hazards: [],
        status,
        lat,
        lng,
        geohash: geohashForLocation([lat, lng]),
        photoPath,
        confirmations,
        reporterId: reporter[0],
        reporterName: reporter[1],
        aiConfidence: 0.85 + rand() * 0.13,
        createdAt,
        updatedAt: createdAt,
      };

      if (status === "resolved") {
        const proofPath = `resolutions/seed-${n}.jpg`;
        await upload(proofPath, "fixed");
        doc.resolution = {
          proofPath,
          verified: true,
          verifiedAt: createdAt,
          note: "AI confirmed the issue is fixed in the after photo.",
        };
        tally[reporter[0]].resolve++;
      }
      await db.collection("issues").add(doc);
    }
  }

  // Users with points derived from their activity + some community confirms.
  for (const [uid, displayName] of USERS) {
    const t = tally[uid];
    const confirmCount = int(2, 9);
    const points = t.report * 10 + confirmCount * 5 + t.resolve * 20;
    await db.collection("users").doc(uid).set({
      displayName,
      points,
      reportCount: t.report,
      confirmCount,
      resolveCount: t.resolve,
      updatedAt: Date.now(),
    });
  }

  console.log(`Seeded ${n} issues and ${USERS.length} users.`);
  process.exit(0);
}
main();
