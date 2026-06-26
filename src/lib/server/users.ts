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

export async function getLeaderboard(limit = 20): Promise<LeaderUser[]> {
  const snap = await db
    .collection(USERS)
    .orderBy("points", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      uid: d.id,
      displayName: x.displayName ?? "Anonymous",
      points: x.points ?? 0,
      reportCount: x.reportCount ?? 0,
      confirmCount: x.confirmCount ?? 0,
      resolveCount: x.resolveCount ?? 0,
    };
  });
}
