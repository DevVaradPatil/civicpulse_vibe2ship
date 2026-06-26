"use client";

import { useState } from "react";
import { Sparkles, X, RefreshCw, Loader2, TrendingUp } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { Insights } from "@/lib/types";

export function InsightsWidget() {
  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(force = false) {
    setLoading(true);
    try {
      setInsights(await (await fetch(`/api/insights${force ? "?refresh=1" : ""}`)).json());
    } finally {
      setLoading(false);
    }
  }

  function openPanel() {
    setOpen(true);
    if (!insights) load();
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="flex max-h-[70vh] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
          <header className="flex items-center justify-between border-b border-border p-3">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-brand" /> AI insights
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => load(true)}
                disabled={loading}
                aria-label="Refresh insights"
                className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="overflow-y-auto p-4 text-sm">
            {!insights ? (
              <div className="flex items-center gap-2 text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating insights…
              </div>
            ) : (
              <>
                <p>{insights.summary}</p>
                {insights.predictions.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {insights.predictions.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {insights.generatedAt > 0 && (
                  <p className="mt-3 text-xs text-muted">Updated {timeAgo(insights.generatedAt)}</p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={openPanel}
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-medium text-brand-fg shadow-lg transition-colors hover:bg-brand-hover"
        >
          <Sparkles className="h-5 w-5" /> AI insights
        </button>
      )}
    </div>
  );
}
