import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Uses Application Default Credentials:
//  - On Cloud Run: the runtime service account.
//  - Locally: `gcloud auth application-default login`.
const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "civicpulse-v2s-01";

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}

export const db = getFirestore();
export const ISSUES = "issues";
