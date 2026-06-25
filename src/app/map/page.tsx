"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Inbox } from "lucide-react";
import { IssueCard } from "@/components/issue-card";
import { LinkButton } from "@/components/ui/button";
import type { Issue } from "@/lib/types";

const IssueMap = dynamic(() => import("@/components/issue-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const [issues, setIssues] = useState<Issue[] | null>(null);

  useEffect(() => {
    fetch("/api/issues")
      .then((r) => r.json())
      .then((d) => setIssues(d.issues ?? []))
      .catch(() => setIssues([]));
  }, []);

  const map = useMemo(
    () => <IssueMap issues={issues ?? []} />,
    [issues],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Issue map</h1>
          <p className="text-sm text-muted">
            {issues === null
              ? "Loading…"
              : `${issues.length} issue${issues.length === 1 ? "" : "s"} across Delhi`}
          </p>
        </div>
        <LinkButton href="/report">Report</LinkButton>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="h-[60vh] overflow-hidden rounded-lg border border-border lg:h-[72vh]">
          {map}
        </div>

        <div className="space-y-2 lg:max-h-[72vh] lg:overflow-y-auto">
          {issues === null ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading issues…
            </div>
          ) : issues.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              <Inbox className="mx-auto h-7 w-7" />
              <p className="mt-2 text-sm">No issues yet. Be the first to report one.</p>
            </div>
          ) : (
            issues.map((i) => <IssueCard key={i.id} issue={i} />)
          )}
        </div>
      </div>
    </div>
  );
}
