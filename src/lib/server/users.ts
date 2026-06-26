import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase-admin";
import type { LeaderUser } from "@/lib/types";

const USERS = "users";

export type PointAction = "report" | "confirm" | "resolve";

export const POINTS: Record<PointAction, number> = {
  report: 10,
  confirm: 5,
  resolve: 20,
};

/** Upserts a user and atomically increments points + the action counter. */
export async function awardPoints(
  uid: string | undefined,
  displayName: string | undefined,
  action: PointAction,
): Promise<void> {
  if (!uid) return;
  const ref = db.collection(USERS).doc(uid);
  await ref.set(
    {
      displayName: displayName?.trim() || "Anonymous",
      points: FieldValue.increment(POINTS[action]),
      [`${action}Count`]: FieldValue.increment(1),
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

function toUser(id: string, x: FirebaseFirestore.DocumentData): LeaderUser {
  return {
    uid: id,
    displayName: x.displayName ?? "Anonymous",
    photoURL: x.photoURL ?? undefined,
    points: x.points ?? 0,
    reportCount: x.reportCount ?? 0,
    confirmCount: x.confirmCount ?? 0,
    resolveCount: x.resolveCount ?? 0,
  };
}

export async function getLeaderboard(limit = 20): Promise<LeaderUser[]> {
  const snap = await db
    .collection(USERS)
    .orderBy("points", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => toUser(d.id, d.data()));
}

export async function getUser(uid: string): Promise<LeaderUser | null> {
  const doc = await db.collection(USERS).doc(uid).get();
  return doc.exists ? toUser(doc.id, doc.data()!) : null;
}

/** Upserts a profile's display name / photo without disturbing points. */
export async function ensureProfile(
  uid: string,
  displayName?: string | null,
  photoURL?: string | null,
): Promise<void> {
  const data: FirebaseFirestore.DocumentData = { updatedAt: Date.now() };
  if (displayName) data.displayName = displayName.slice(0, 40);
  if (photoURL) data.photoURL = photoURL;
  await db.collection(USERS).doc(uid).set(data, { merge: true });
}
