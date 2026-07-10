// Removes seed-created demo data (dev utility).
//
//   node scripts/reset-issues.mjs         → delete ONLY seed-* issues/users
//   node scripts/reset-issues.mjs --all   → delete EVERYTHING (destructive!)
//
// Requires ADC (`gcloud auth application-default login`).
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const ALL = process.argv.includes("--all");
const projectId = process.env.FIREBASE_PROJECT_ID || "civicpulse-v2s-01";
if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

const isSeedId = (v) => typeof v === "string" && v.startsWith("seed-");

const issues = await db.collection("issues").get();
const users = await db.collection("users").get();

const delIssues = ALL
  ? issues.docs
  : issues.docs.filter((d) => d.data().seed === true || isSeedId(d.data().reporterId));
const delUsers = ALL ? users.docs : users.docs.filter((d) => isSeedId(d.id));

if (!ALL) {
  console.log(
    `Preserving ${issues.size - delIssues.length} real issue(s) and ${users.size - delUsers.length} real user(s).`,
  );
} else {
  console.warn("--all: deleting ALL issues and users, including real ones!");
}

const batch = db.batch();
[...delIssues, ...delUsers].forEach((d) => batch.delete(d.ref));
await batch.commit();
await db.collection("meta").doc("insights").delete().catch(() => {});

console.log(`Deleted ${delIssues.length} issue(s) and ${delUsers.length} user(s).`);
process.exit(0);
