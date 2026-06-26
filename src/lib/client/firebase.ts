"use client";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Firebase web config is fetched at runtime from /api/firebase-config (served from
// server env) instead of being baked into the build — keeps it out of the repo/image.
export const googleProvider = new GoogleAuthProvider();

let authInstance: Auth | undefined;
let initPromise: Promise<Auth | null> | undefined;

export function ensureFirebase(): Promise<Auth | null> {
  if (authInstance) return Promise.resolve(authInstance);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const res = await fetch("/api/firebase-config");
      if (!res.ok) return null;
      const config = await res.json();
      if (!config.apiKey) return null;
      const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
      authInstance = getAuth(app);
      return authInstance;
    } catch {
      return null;
    }
  })();
  return initPromise;
}
