// Deletes all issue docs (dev utility). Usage: node scripts/reset-issues.mjs
// Requires ADC (`gcloud auth application-default login`).
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "civicpulse-v2s-01";
if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId });
}
const db = getFirestore();

const snap = await db.collection("issues").get();
const batch = db.batch();
snap.docs.forEach((d) => batch.delete(d.ref));
await batch.commit();
console.log(`Deleted ${snap.size} issue(s).`);
process.exit(0);
