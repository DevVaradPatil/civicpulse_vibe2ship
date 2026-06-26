"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider, firebaseConfigured } from "@/lib/client/firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No Firebase config yet → run without auth instead of crashing.
    if (!firebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
        // Sync display name / photo to the profile (server verifies the token).
        if (!u.isAnonymous) {
          try {
            const token = await u.getIdToken();
            await fetch("/api/me", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                displayName: u.displayName,
                photoURL: u.photoURL,
              }),
            });
          } catch {
            /* non-fatal */
          }
        }
      } else {
        // No session yet → sign in anonymously so every visitor has a stable uid.
        try {
          await signInAnonymously(auth);
        } catch {
          setUser(null);
          setLoading(false);
        }
      }
    });
    return unsub;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth); // listener re-signs in anonymously
  }, []);

  const authedFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    const u = auth.currentUser;
    if (u) headers.set("Authorization", `Bearer ${await u.getIdToken()}`);
    return fetch(input, { ...init, headers });
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        isAnonymous: user?.isAnonymous ?? true,
        signInWithGoogle,
        signOutUser,
        authedFetch,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
