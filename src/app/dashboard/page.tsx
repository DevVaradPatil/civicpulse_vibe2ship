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
import { Donut, TrendArea, HBar } from "@/components/charts";
import { CATEGORIES, STATUSES, type IssueStatus, type IssueCategory } from "@/lib/domain";
import { CATEGORY_COLOR, STATUS_COLOR, SEVERITY_COLOR } from "@/lib/colors";
import { timeAgo } from "@/lib/format";
import type { DashboardStats, Hotspot, Insights } from "@/lib/types";

const SEV = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "med", label: "Medium" },
  { key: "low", label: "Low" },
] as const;

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string; // e.g. "bg-brand/10 text-brand"
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </span>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Card({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
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
    fetch("/api/insights").then((r) => r.json()).then(setInsights).catch(() => {});
  }, []);

  async function refreshInsights() {
    setRefreshing(true);
    try {
      setInsights(await (await fetch("/api/insights?refresh=1")).json());
    } finally {
      setRefreshing(false);
    }
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-7 w-48 animate-pulse rounded bg-surface" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-60 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const open = stats.total - stats.resolved;
  const catMax = Math.max(1, ...Object.values(stats.byCategory));
  const statusSegments = (Object.keys(stats.byStatus) as IssueStatus[]).map((s) => ({
    label: STATUSES[s].label,
    value: stats.byStatus[s],
    color: STATUS_COLOR[s],
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Impact dashboard</h1>
      <p className="text-sm text-muted">Civic-issue health across Delhi.</p>

      {/* Stat cards — distinct accent colors */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ListChecks className="h-5 w-5" />} label="Total reports" value={String(stats.total)} accent="bg-brand/10 text-brand" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Resolved" value={`${Math.round(stats.resolutionRate * 100)}%`} sub={`${stats.resolved} of ${stats.total}`} accent="bg-status-resolved/10 text-status-resolved" />
        <StatCard icon={<CircleDot className="h-5 w-5" />} label="Open" value={String(open)} accent="bg-status-progress/10 text-status-progress" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Last 7 days" value={String(stats.last7Days)} accent="bg-cat-other/10 text-cat-other" />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Status breakdown">
          <div className="flex items-center gap-4">
            <Donut segments={statusSegments} centerValue={String(stats.total)} centerLabel="issues" />
            <ul className="space-y-1.5 text-sm">
              {statusSegments.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-muted">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Reports this week">
          <TrendArea points={stats.trend7} />
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" /> AI insights
            </span>
          }
          action={
            <Button variant="secondary" onClick={refreshInsights} disabled={refreshing} className="px-3 py-1.5 text-xs">
              {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          }
        >
          {!insights ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </div>
          ) : (
            <>
              <p className="text-sm">{insights.summary}</p>
              <ul className="mt-3 space-y-2">
                {insights.predictions.slice(0, 4).map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {insights.generatedAt > 0 && (
                <p className="mt-3 text-xs text-muted">Updated {timeAgo(insights.generatedAt)}</p>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Breakdown bars */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="By category">
          <div className="space-y-3">
            {(Object.keys(stats.byCategory) as IssueCategory[]).map((c) => (
              <HBar
                key={c}
                label={
                  <>
                    <CategoryIcon category={c} className="h-3.5 w-3.5" />
                    {CATEGORIES[c].label}
                  </>
                }
                value={stats.byCategory[c]}
                max={catMax}
                color={CATEGORY_COLOR[c]}
              />
            ))}
          </div>
        </Card>

        <Card title="By severity">
          <div className="space-y-3">
            {SEV.map((s) => (
              <HBar
                key={s.key}
                label={s.label}
                value={stats.bySeverity[s.key]}
                max={Math.max(1, ...Object.values(stats.bySeverity))}
                color={SEVERITY_COLOR[s.key]}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Hotspots */}
      <div className="mt-4">
        <Card
          title={
            <span className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-sev-high" /> Predicted hotspots
            </span>
          }
        >
          {hotspots.length === 0 ? (
            <p className="text-sm text-muted">No hotspots yet — they emerge as issues cluster.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOR[h.topCategory] }} />
                      {CATEGORIES[h.topCategory].label}
                    </span>
                    <span className="text-xs text-muted">#{i + 1}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">{h.count} issues · {h.openCount} open</div>
                  <div className="mt-0.5 text-xs text-muted">~{h.lat.toFixed(3)}, {h.lng.toFixed(3)}</div>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
