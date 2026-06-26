import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  MapPin,
  ScanSearch,
  Layers,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { IssueCard } from "@/components/issue-card";
import { getDashboard } from "@/lib/server/stats";

export const dynamic = "force-dynamic";

const AGENTS = [
  { icon: ScanSearch, name: "Triage", body: "Reads the photo → category + severity." },
  { icon: Layers, name: "Dedup", body: "Clusters duplicate reports nearby." },
  { icon: Building2, name: "Routing", body: "Drafts the complaint to the right authority." },
  { icon: ShieldCheck, name: "Verify", body: "Confirms the fix from an after-photo." },
  { icon: Sparkles, name: "Insights", body: "Predicts hotspots and trends." },
];

export default async function Home() {
  const { stats, hotspots, issues } = await getDashboard();
  const recent = issues.slice(0, 4);

  const statCards = [
    { value: String(stats.total), label: "Reports" },
    { value: `${Math.round(stats.resolutionRate * 100)}%`, label: "Resolved" },
    { value: String(hotspots.length), label: "Hotspots" },
    { value: String(stats.last7Days), label: "This week" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <MapPin className="h-3.5 w-3.5 text-brand" />
              AI-powered civic platform · Delhi
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Delhi&rsquo;s civic issues, reported by citizens and{" "}
              <span className="text-brand">resolved with AI</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Snap a pothole, leak, broken light or garbage. An AI agent pipeline
              triages it, routes it to the right authority, tracks it, and verifies the
              fix — while the community confirms and a dashboard predicts where problems
              strike next.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/report" className="px-5 py-2.5 text-base">
                <Camera className="h-5 w-5" />
                Report an issue
              </LinkButton>
              <LinkButton href="/map" variant="secondary" className="px-5 py-2.5 text-base">
                Explore the map
              </LinkButton>
            </div>
          </div>

          {/* Delhi issue map */}
          <div className="order-first lg:order-last">
            <Image
              src="/delhi_vector_map.png"
              alt="Map of reported civic issues across Delhi"
              width={1536}
              height={1024}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* Live stats */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-4">
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agent pipeline */}
      <section className="border-t border-border py-14">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          A multi-agent pipeline does the work
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {AGENTS.map(({ icon: Icon, name, body }, i) => (
            <div key={name} className="relative rounded-lg border border-border bg-surface p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-brand-fg">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-medium">{name}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
              {i < AGENTS.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Live feed */}
      {recent.length > 0 && (
        <section className="border-t border-border py-14">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
              Live from Delhi
            </h2>
            <Link href="/map" className="flex items-center gap-1 text-sm text-brand hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {recent.map((i) => (
              <IssueCard key={i.id} issue={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
