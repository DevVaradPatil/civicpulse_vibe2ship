"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Loader2, Camera, ThumbsUp, ShieldCheck } from "lucide-react";
import { tierFor } from "@/lib/badges";
import type { LeaderUser } from "@/lib/types";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderUser[] | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-fg">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Community heroes</h1>
          <p className="text-sm text-muted">
            Points for reporting, confirming, and verified fixes.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        {users === null ? (
          <div className="flex items-center gap-2 p-4 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            No heroes yet. Report or confirm an issue to get on the board.
          </div>
        ) : (
          users.map((u, i) => (
            <Link
              key={u.uid}
              href={`/u/${u.uid}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-surface"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  i < 3 ? "bg-brand text-brand-fg" : "bg-surface text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-medium">
                {u.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  (u.displayName || "U").charAt(0).toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.displayName}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="font-medium text-brand">{tierFor(u.points).name}</span>
                  <span className="flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" /> {u.reportCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" /> {u.confirmCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> {u.resolveCount}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-lg font-semibold">{u.points}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
