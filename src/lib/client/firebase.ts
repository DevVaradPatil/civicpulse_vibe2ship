"use client";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard so a missing config (e.g. during build before envs are set) doesn't crash SSR.
const app: FirebaseApp | undefined = config.apiKey
  ? getApps().length
    ? getApp()
    : initializeApp(config)
  : undefined;

export const auth = (app ? getAuth(app) : undefined) as Auth;
export const googleProvider = new GoogleAuthProvider();
export const firebaseConfigured = Boolean(config.apiKey);
