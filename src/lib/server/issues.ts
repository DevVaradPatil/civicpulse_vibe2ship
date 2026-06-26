import "server-only";
import { geohashForLocation, distanceBetween } from "geofire-common";
import { db, ISSUES } from "@/lib/server/firebase-admin";
import type { Complaint, Issue, NewIssueInput } from "@/lib/types";
import { uploadImage, decodeImage, getFile } from "@/lib/server/storage";
import { verifyResolution, type VerificationResult } from "@/lib/agents/verifier";
import { draftComplaint } from "@/lib/agents/routing";
import { CATEGORIES, CONFIRMATIONS_TO_VERIFY, type IssueCategory } from "@/lib/domain";

/** Dedup agent (deterministic): count same-category issues within ~250m. */
const DUP_RADIUS_KM = 0.25;

function docToIssue(id: string, d: FirebaseFirestore.DocumentData): Issue {
  return {
    id,
    title: d.title,
    description: d.description,
    category: d.category,
    severity: d.severity,
    hazards: d.hazards ?? [],
    status: d.status ?? "reported",
    lat: d.lat,
    lng: d.lng,
    geohash: d.geohash,
    photoPath: d.photoPath,
    confirmations: d.confirmations ?? 0,
    reporterId: d.reporterId,
    aiConfidence: d.aiConfidence,
    resolution: d.resolution,
    routing: d.routing,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function createIssue(input: NewIssueInput): Promise<Issue> {
  const { buffer, mimeType } = decodeImage(input.imageBase64, input.mimeType);
  const photoPath = await uploadImage(buffer, mimeType, "issues");

  const now = Date.now();
  const data = {
    title: input.triage.title,
    description: input.triage.description,
    category: input.triage.category,
    severity: input.triage.severity,
    hazards: input.triage.hazards,
    status: "reported" as const,
    lat: input.lat,
    lng: input.lng,
    geohash: geohashForLocation([input.lat, input.lng]),
    photoPath,
    confirmations: 0,
    reporterId: input.reporterId ?? null,
    aiConfidence: input.triage.confidence,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(ISSUES).add(data);
  return docToIssue(ref.id, data);
}

export async function listIssues(limit = 200): Promise<Issue[]> {
  const snap = await db
    .collection(ISSUES)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => docToIssue(doc.id, doc.data()));
}

export async function getIssue(id: string): Promise<Issue | null> {
  const doc = await db.collection(ISSUES).doc(id).get();
  return doc.exists ? docToIssue(doc.id, doc.data()!) : null;
}

/** Dedup agent: number of nearby same-category reports (excluding this one). */
export async function countNearbyDuplicates(
  lat: number,
  lng: number,
  category: IssueCategory,
  excludeId: string,
): Promise<number> {
  const snap = await db.collection(ISSUES).where("category", "==", category).get();
  let n = 0;
  for (const doc of snap.docs) {
    if (doc.id === excludeId) continue;
    const d = doc.data();
    if (distanceBetween([lat, lng], [d.lat, d.lng]) <= DUP_RADIUS_KM) n++;
  }
  return n;
}

/** Routing agent (cached): drafts/returns the authority complaint for an issue. */
export async function getOrDraftComplaint(
  id: string,
  force = false,
): Promise<Complaint | null> {
  const ref = db.collection(ISSUES).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const issue = docToIssue(id, doc.data()!);
  if (issue.routing && !force) return issue.routing;

  const drafted = await draftComplaint(issue);
  const complaint: Complaint = {
    ...drafted,
    department: CATEGORIES[issue.category].department,
    generatedAt: Date.now(),
  };
  await ref.update({ routing: complaint, updatedAt: Date.now() });
  return complaint;
}

/** Community confirm. Idempotent per uid; auto-verifies at the threshold. */
export async function confirmIssue(
  id: string,
  uid?: string,
): Promise<{ issue: Issue; counted: boolean } | null> {
  const ref = db.collection(ISSUES).doc(id);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) return null;
    const d = doc.data()!;
    const confirmedBy: string[] = d.confirmedBy ?? [];
    if (uid && confirmedBy.includes(uid)) {
      return { issue: docToIssue(id, d), counted: false };
    }
    const confirmations = (d.confirmations ?? 0) + 1;
    const updates: FirebaseFirestore.DocumentData = {
      confirmations,
      updatedAt: Date.now(),
    };
    if (uid) updates.confirmedBy = [...confirmedBy, uid];
    if (d.status === "reported" && confirmations >= CONFIRMATIONS_TO_VERIFY) {
      updates.status = "verified";
    }
    tx.update(ref, updates);
    return { issue: docToIssue(id, { ...d, ...updates }), counted: true };
  });
}

export async function setInProgress(id: string): Promise<Issue | null> {
  const ref = db.collection(ISSUES).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updates = { status: "in_progress" as const, updatedAt: Date.now() };
  await ref.update(updates);
  return docToIssue(id, { ...doc.data()!, ...updates });
}

/** Resolve flow: runs the Resolution Verifier agent on before/after photos. */
export async function resolveIssue(
  id: string,
  proofImage: string,
  mimeType: string,
): Promise<{ issue: Issue; verification: VerificationResult } | null> {
  const ref = db.collection(ISSUES).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const d = doc.data()!;

  const [beforeBuf] = await getFile(d.photoPath).download();
  const beforeMime = String(d.photoPath).endsWith(".png")
    ? "image/png"
    : "image/jpeg";

  const { buffer: afterBuf, mimeType: afterMime } = decodeImage(proofImage, mimeType);
  const proofPath = await uploadImage(afterBuf, afterMime, "resolutions");

  const verification = await verifyResolution(
    beforeBuf.toString("base64"),
    beforeMime,
    afterBuf.toString("base64"),
    afterMime,
    d.category,
    d.title,
  );

  const resolution = {
    proofPath,
    verified: verification.resolved,
    verifiedAt: Date.now(),
    note: verification.note,
  };
  const updates: FirebaseFirestore.DocumentData = {
    resolution,
    updatedAt: Date.now(),
  };
  if (verification.resolved) updates.status = "resolved";
  await ref.update(updates);

  return { issue: docToIssue(id, { ...d, ...updates }), verification };
}
