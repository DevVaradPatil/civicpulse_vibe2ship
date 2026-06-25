import "server-only";
import { geohashForLocation } from "geofire-common";
import { db, ISSUES } from "@/lib/server/firebase-admin";
import type { Issue, NewIssueInput } from "@/lib/types";
import { uploadImage, decodeImage } from "@/lib/server/storage";

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
