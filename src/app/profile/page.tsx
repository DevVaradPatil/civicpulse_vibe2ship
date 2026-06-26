"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, LogIn, Pencil, Check } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ProfileView } from "@/components/profile-view";
import type { Issue, LeaderUser } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading, isAnonymous, signInWithGoogle, authedFetch } = useAuth();
  const [data, setData] = useState<{ profile: LeaderUser; reports: Issue[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    if (!user || isAnonymous) return;
    const r = await fetch(`/api/users/${user.uid}`);
    if (r.ok) {
      const d = await r.json();
      setData(d);
      setName(d.profile.displayName);
    }
  }, [user, isAnonymous]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveName() {
    await authedFetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name }),
    });
    setEditing(false);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (isAnonymous || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Sign in to view your profile</h1>
        <p className="mt-2 text-sm text-muted">
          Track your reports, points and badges as a CivicPulse hero.
        </p>
        <button
          onClick={signInWithGoogle}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-hover"
        >
          <LogIn className="h-4 w-4" /> Sign in with Google
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading profile…
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
            />
            <button
              onClick={saveName}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-fg"
            >
              <Check className="h-4 w-4" /> Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit display name
          </button>
        )}
      </div>
      <ProfileView profile={data.profile} reports={data.reports} />
    </div>
  );
}
