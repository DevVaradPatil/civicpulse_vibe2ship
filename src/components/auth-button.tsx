"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, User as UserIcon, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function AuthButton() {
  const { user, loading, isAnonymous, signInWithGoogle, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted" />;
  }

  // Signed-in (Google) user → avatar menu.
  if (user && !isAnonymous) {
    const initial = (user.displayName || "U").charAt(0).toUpperCase();
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand text-sm font-medium text-brand-fg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-40 mt-2 w-44 rounded-lg border border-border bg-bg p-1 shadow-sm">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"
              >
                <UserIcon className="h-4 w-4" /> My profile
              </Link>
              <button
                onClick={async () => {
                  setOpen(false);
                  await signOutUser();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Anonymous / signed-out → sign-in button.
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await signInWithGoogle();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-border/40 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
      Sign in
    </button>
  );
}
