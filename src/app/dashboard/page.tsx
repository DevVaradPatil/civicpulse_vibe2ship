"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  TrendingUp,
  Flame,
  Sparkles,
  RefreshCw,
  Loader2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CATEGORIES, STATUSES, type IssueStatus, type IssueCategory } from "@/lib/domain";
import { timeAgo } from "@/lib/format";
import type { DashboardStats, Hotspot, Insights } from "@/lib/types";

const STATUS_VAR: Record<IssueStatus, string> = {
  reported: "var(--color-status-reported)",
  verified: "var(--color-status-verified)",
  in_progress: "var(--color-status-progress)",
  resolved: "var(--color-status-resolved)",
};
const SEV = [
  { key: "low", label: "Low", color: "var(--color-sev-low)" },
  { key: "med", label: "Medium", color: "var(--color-sev-med)" },
  { key: "high", label: "High", color: "var(--color-sev-high)" },
  { key: "critical", label: "Critical", color: "var(--color-sev-critical)" },
] as const;

function Bar({ label, value, max, color }: { label: React.ReactNode; value: number; max: number; color: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-1.5 text-sm text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setHotspots(d.hotspots ?? []);
      })
      .catch(() => setStats(null));
    fetch("/api/insights")
      .then((r) => r.json())
      .then(setInsights)
      .catch(() => {});
  }, []);

  async function refreshInsights() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/insights?refresh=1");
      setInsights(await r.json());
    } finally {
      setRefreshing(false);
    }
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
      </div>
    );
  }

  const open = stats.total - stats.resolved;
  const catMax = Math.max(1, ...Object.values(stats.byCategory));
  const sevMax = Math.max(1, ...Object.values(stats.bySeverity));
  const statusMax = Math.max(1, ...Object.values(stats.byStatus));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Impact dashboard</h1>
      <p className="text-sm text-muted">Civic-issue health across Delhi.</p>

      {/* Stat cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ListChecks className="h-4 w-4" />} label="Total reports" value={String(stats.total)} />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Resolved"
          value={`${Math.round(stats.resolutionRate * 100)}%`}
          sub={`${stats.resolved} of ${stats.total}`}
        />
        <StatCard icon={<CircleDot className="h-4 w-4" />} label="Open" value={String(open)} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Last 7 days" value={String(stats.last7Days)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Breakdowns */}
        <div className="space-y-6 rounded-lg border border-border p-5">
          <div>
            <h2 className="text-sm font-medium">By status</h2>
            <div className="mt-3 space-y-3">
              {(Object.keys(stats.byStatus) as IssueStatus[]).map((s) => (
                <Bar key={s} label={STATUSES[s].label} value={stats.byStatus[s]} max={statusMax} color={STATUS_VAR[s]} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium">By category</h2>
            <div className="mt-3 space-y-3">
              {(Object.keys(stats.byCategory) as IssueCategory[]).map((c) => (
                <Bar
                  key={c}
                  label={
                    <>
                      <CategoryIcon category={c} className="h-3.5 w-3.5" />
                      {CATEGORIES[c].label}
                    </>
                  }
                  value={stats.byCategory[c]}
                  max={catMax}
                  color="var(--color-brand)"
                />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium">By severity</h2>
            <div className="mt-3 space-y-3">
              {SEV.map((s) => (
                <Bar key={s.key} label={s.label} value={stats.bySeverity[s.key]} max={sevMax} color={s.color} />
              ))}
            </div>
          </div>
        </div>

        {/* AI insights */}
        <div className="rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-brand" />
              AI insights
            </h2>
            <Button variant="secondary" onClick={refreshInsights} disabled={refreshing} className="px-3 py-1.5 text-xs">
              {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>

          {!insights ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm">{insights.summary}</p>
              {insights.predictions.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {insights.predictions.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
              {insights.generatedAt > 0 && (
                <p className="mt-4 text-xs text-muted">Updated {timeAgo(insights.generatedAt)}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hotspots */}
      <div className="mt-6 rounded-lg border border-border p-5">
        <h2 className="flex items-center gap-2 font-medium">
          <Flame className="h-4 w-4 text-sev-high" />
          Predicted hotspots
        </h2>
        <p className="text-sm text-muted">Areas with recurring issues.</p>
        {hotspots.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No hotspots yet — they emerge as issues cluster.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hotspots.map((h, i) => (
              <a
                key={h.cell}
                href={`https://www.openstreetmap.org/?mlat=${h.lat}&mlon=${h.lng}#map=15/${h.lat}/${h.lng}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border p-3 hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <CategoryIcon category={h.topCategory} className="h-4 w-4" />
                    {CATEGORIES[h.topCategory].label}
                  </span>
                  <span className="text-xs text-muted">#{i + 1}</span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {h.count} issues · {h.openCount} open
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  ~{h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
