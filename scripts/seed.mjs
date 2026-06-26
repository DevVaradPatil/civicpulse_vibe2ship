// Seeds a realistic Delhi demo dataset. Usage: node scripts/seed.mjs
// Requires ADC (`gcloud auth application-default login`) and scripts/seed-img/*.jpg.
import { readFileSync } from "node:fs";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Storage } from "@google-cloud/storage";
import { geohashForLocation } from "geofire-common";

const projectId = process.env.FIREBASE_PROJECT_ID || "civicpulse-v2s-01";
const bucketName = process.env.GCS_BUCKET || "civicpulse-v2s-01-media";
if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId });
}
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

const DAY = 86_400_000;

// title, category, severity, lat, lng, status, confirmations, daysAgo, resolved?
const ISSUES = [
  ["Deep pothole near CP inner circle", "pothole", 4, 28.6315, 77.2167, "reported", 2, 1],
  ["Water main leaking onto road, CP", "water_leak", 3, 28.6320, 77.2172, "verified", 3, 3],
  ["Garbage pile-up behind CP block", "waste", 2, 28.6308, 77.2160, "in_progress", 3, 5],
  ["Dark streetlight, Lajpat Nagar market", "streetlight", 3, 28.5677, 77.2433, "reported", 1, 2],
  ["Pothole fixed on Ring Road, Lajpat", "pothole", 4, 28.5681, 77.2438, "resolved", 5, 8, true],
  ["Overflowing bin, Karol Bagh", "waste", 3, 28.6512, 77.1907, "verified", 4, 4],
  ["Flickering streetlight, Saket", "streetlight", 2, 28.5245, 77.2066, "reported", 0, 1],
  ["Burst pipeline, Dwarka Sector 10", "water_leak", 4, 28.5829, 77.0588, "in_progress", 3, 6],
  ["Dangerous crater, Rohini", "pothole", 5, 28.7361, 77.1170, "reported", 2, 0],
  ["Waste dumping, Chandni Chowk", "waste", 4, 28.6562, 77.2301, "verified", 3, 2],
  ["Broken footpath repaired, Hauz Khas", "other", 2, 28.5494, 77.2001, "resolved", 4, 10, true],
  ["Pothole cluster, Nehru Place", "pothole", 3, 28.5494, 77.2533, "reported", 1, 1],
];

const USERS = [
  ["seed-priya", "Priya Sharma", 45, 3, 1, 1],
  ["seed-aarav", "Aarav Gupta", 30, 2, 2, 0],
  ["seed-neha", "Neha Singh", 25, 1, 3, 0],
  ["seed-rahul", "Rahul Verma", 15, 1, 1, 0],
  ["seed-anon", "Anonymous", 10, 1, 0, 0],
];

async function main() {
  // clear
  for (const col of ["issues", "users", "meta"]) {
    const snap = await db.collection(col).get();
    const b = db.batch();
    snap.docs.forEach((d) => b.delete(d.ref));
    await b.commit();
  }

  let n = 0;
  for (const [title, category, severity, lat, lng, status, confirmations, daysAgo, resolved] of ISSUES) {
    n++;
    const photoPath = `issues/seed-${n}.jpg`;
    await upload(photoPath, category);
    const createdAt = Date.now() - daysAgo * DAY;
    const doc = {
      title, description: title + ".", category, severity, hazards: [],
      status, lat, lng, geohash: geohashForLocation([lat, lng]),
      photoPath, confirmations, reporterId: null, aiConfidence: 0.9,
      createdAt, updatedAt: createdAt,
    };
    if (resolved) {
      const proofPath = `resolutions/seed-${n}.jpg`;
      await upload(proofPath, "fixed");
      doc.resolution = { proofPath, verified: true, verifiedAt: createdAt, note: "AI confirmed the issue is fixed in the after photo." };
    }
    await db.collection("issues").add(doc);
  }

  for (const [uid, displayName, points, reportCount, confirmCount, resolveCount] of USERS) {
    await db.collection("users").doc(uid).set({ displayName, points, reportCount, confirmCount, resolveCount, updatedAt: Date.now() });
  }

  console.log(`Seeded ${ISSUES.length} issues and ${USERS.length} users.`);
  process.exit(0);
}
main();
