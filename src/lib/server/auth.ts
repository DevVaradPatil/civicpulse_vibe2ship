import "server-only";
import { getAuth } from "firebase-admin/auth";
import "@/lib/server/firebase-admin"; // ensures admin app is initialized

export interface AuthedUser {
  uid: string;
  name?: string;
  picture?: string;
}

/** Verifies the Firebase ID token from the Authorization header. Returns null if absent/invalid. */
export async function getUserFromRequest(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    return { uid: decoded.uid, name: decoded.name, picture: decoded.picture };
  } catch {
    return null;
  }
}
