import {
  Camera,
  ScanSearch,
  Users,
  CheckCircle2,
  LineChart,
  MapPin,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { CATEGORY_LIST } from "@/lib/domain";

const STEPS = [
  {
    icon: Camera,
    title: "Snap & report",
    body: "Photograph a pothole, leak, broken light or garbage. Location is captured automatically.",
  },
  {
    icon: ScanSearch,
    title: "AI triages it",
    body: "Gemini categorizes the issue and rates its severity from the photo in seconds.",
  },
  {
    icon: Users,
    title: "Community verifies",
    body: "Neighbours confirm the issue. Duplicates are merged so signal stays clean.",
  },
  {
    icon: CheckCircle2,
    title: "AI verifies the fix",
    body: "Upload a resolution photo and AI confirms it was actually fixed — closing the loop.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="flex items-center gap-2 text-sm text-muted">
          <MapPin className="h-4 w-4 text-brand" />
          Now live for Delhi
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Report a civic issue. The community and AI take it from there.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          CivicPulse turns a single photo into a tracked, verified, and
          resolved civic action — potholes, water leaks, broken streetlights
          and waste, all in one transparent place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/report" className="px-5 py-2.5 text-base">
            <Camera className="h-5 w-5" />
            Report an issue
          </LinkButton>
          <LinkButton
            href="/map"
            variant="secondary"
            className="px-5 py-2.5 text-base"
          >
            Explore the map
          </LinkButton>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-14">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-brand-fg">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories + insights teaser */}
      <section className="grid gap-4 border-t border-border py-14 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            What you can report
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORY_LIST.map((c) => (
              <span
                key={c.id}
                className="rounded-full border border-border bg-bg px-3 py-1.5 text-sm"
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-brand-fg">
            <LineChart className="h-5 w-5" />
          </span>
          <h3 className="mt-3 font-medium">Impact dashboard</h3>
          <p className="mt-1 text-sm text-muted">
            See resolution rates, hotspots, and AI-predicted recurring problem
            areas across Delhi.
          </p>
        </div>
      </section>
    </div>
  );
}
