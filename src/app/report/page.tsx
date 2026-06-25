"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  MapPin,
  Loader2,
  CheckCircle2,
  TriangleAlert,
  RefreshCw,
  Send,
} from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { CATEGORY_LIST, type IssueCategory, DELHI } from "@/lib/domain";
import type { TriageResult } from "@/lib/types";
import { fileToCompressedDataUrl, getPosition } from "@/lib/client/image";

type Phase = "idle" | "analyzing" | "review" | "submitting" | "done";

export default function ReportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string>("");
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [category, setCategory] = useState<IssueCategory>("other");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string>("");
  const [createdId, setCreatedId] = useState<string>("");

  async function captureLocation() {
    setLocating(true);
    try {
      const pos = await getPosition();
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      // Fall back to Delhi centre so the demo always works indoors.
      setCoords({ ...DELHI.center });
    } finally {
      setLocating(false);
    }
  }

  async function onPick(file: File) {
    setError("");
    setTriage(null);
    setCreatedId("");
    setPhase("analyzing");
    captureLocation();

    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPreview(dataUrl);

      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Triage failed");

      const result = data as TriageResult;
      setTriage(result);
      setCategory(result.category);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase(preview ? "review" : "idle");
    }
  }

  async function submit() {
    if (!triage || !coords) return;
    setPhase("submitting");
    setError("");
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: preview,
          mimeType: "image/jpeg",
          lat: coords.lat,
          lng: coords.lng,
          triage: { ...triage, category },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save report");
      setCreatedId(data.issue.id);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save report");
      setPhase("review");
    }
  }

  function reset() {
    setPhase("idle");
    setPreview("");
    setTriage(null);
    setCoords(null);
    setCreatedId("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Report an issue</h1>
      <p className="mt-1 text-sm text-muted">
        Take or upload a photo. AI will categorize it and rate its severity.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />

      {/* Photo / picker */}
      <div className="mt-6">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Reported issue"
            className="aspect-video w-full rounded-lg border border-border object-cover"
          />
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface text-muted hover:border-brand hover:text-brand"
          >
            <Camera className="h-8 w-8" />
            <span className="text-sm font-medium">Take or upload a photo</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-sev-high/30 bg-sev-high/10 px-3 py-2 text-sm text-sev-high">
          <TriangleAlert className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Analyzing */}
      {phase === "analyzing" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          AI is analyzing the photo…
        </div>
      )}

      {/* Review */}
      {(phase === "review" || phase === "submitting") && triage && (
        <div className="mt-6 space-y-5">
          {!triage.isCivicIssue && (
            <div className="flex items-center gap-2 rounded-lg border border-sev-med/30 bg-sev-med/10 px-3 py-2 text-sm text-sev-med">
              <TriangleAlert className="h-4 w-4" />
              This may not be a civic issue. You can still submit if it is.
            </div>
          )}

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-medium">{triage.title}</h2>
              <SeverityBadge severity={triage.severity} />
            </div>
            <p className="mt-1 text-sm text-muted">{triage.description}</p>
            {triage.hazards.length > 0 && (
              <ul className="mt-3 space-y-1">
                {triage.hazards.map((h) => (
                  <li key={h} className="flex items-center gap-1.5 text-sm text-fg">
                    <TriangleAlert className="h-3.5 w-3.5 text-sev-high" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">
              AI confidence: {Math.round(triage.confidence * 100)}%
            </p>
          </div>

          {/* Category override */}
          <div>
            <label className="text-sm font-medium">Category</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_LIST.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    category === c.id
                      ? "border-brand bg-brand text-brand-fg"
                      : "border-border bg-bg hover:bg-surface"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted">
            <MapPin className="h-4 w-4 text-brand" />
            {locating
              ? "Getting your location…"
              : coords
                ? `Location captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
                : "Location unavailable"}
          </div>

          <div className="flex gap-3">
            <Button onClick={submit} disabled={phase === "submitting" || !coords}>
              {phase === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit report
            </Button>
            <Button variant="secondary" onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              Start over
            </Button>
          </div>
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="mt-6 rounded-lg border border-status-resolved/30 bg-status-resolved/10 p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-status-resolved" />
          <h2 className="mt-2 font-medium">Report submitted</h2>
          <p className="mt-1 text-sm text-muted">
            Thanks for making Delhi better. The community can now verify it.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <LinkButton href={`/issue/${createdId}`}>View issue</LinkButton>
            <LinkButton href="/map" variant="secondary">
              See the map
            </LinkButton>
          </div>
          <button
            onClick={reset}
            className="mt-3 text-sm text-brand hover:underline"
          >
            Report another
          </button>
        </div>
      )}
    </div>
  );
}
