// Deletes all issue + user docs (dev utility). Usage: node scripts/reset-issues.mjs
// Requires ADC (`gcloud auth application-default login`).
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "civicpulse-v2s-01";
if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId });
}
const db = getFirestore();

for (const col of ["issues", "users"]) {
  const snap = await db.collection(col).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`Deleted ${snap.size} doc(s) from ${col}.`);
}
process.exit(0);
