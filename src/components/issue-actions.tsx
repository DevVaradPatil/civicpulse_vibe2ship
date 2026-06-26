"use client";

import { useRef, useState } from "react";
import {
  ThumbsUp,
  Loader2,
  Wrench,
  Upload,
  ShieldCheck,
  ShieldX,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONFIRMATIONS_TO_VERIFY } from "@/lib/domain";
import { getIdentity } from "@/lib/client/identity";
import { fileToCompressedDataUrl } from "@/lib/client/image";
import type { Issue, VerificationResult } from "@/lib/types";

export function IssueActions({ issue: initial }: { issue: Issue }) {
  const [issue, setIssue] = useState<Issue>(initial);
  const [busy, setBusy] = useState<null | "confirm" | "progress" | "resolve">(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const proofRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, CONFIRMATIONS_TO_VERIFY - issue.confirmations);

  async function confirm() {
    setBusy("confirm");
    setError("");
    setInfo("");
    try {
      const id = getIdentity();
      const r = await fetch(`/api/issues/${issue.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: id.uid, name: id.name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setIssue(d.issue);
      if (!d.counted) setInfo("You've already confirmed this issue.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not confirm.");
    } finally {
      setBusy(null);
    }
  }

  async function markProgress() {
    setBusy("progress");
    setError("");
    try {
      const r = await fetch(`/api/issues/${issue.id}/progress`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setIssue(d.issue);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(null);
    }
  }

  async function onProof(file: File) {
    setBusy("resolve");
    setError("");
    setVerification(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      const id = getIdentity();
      const r = await fetch(`/api/issues/${issue.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: "image/jpeg",
          uid: id.uid,
          name: id.name,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setIssue(d.issue);
      setVerification(d.verification);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(null);
      if (proofRef.current) proofRef.current.value = "";
    }
  }

  const isResolved = issue.status === "resolved";

  return (
    <div className="mt-6 space-y-4">
      {/* Confirm */}
      {!isResolved && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={confirm} disabled={busy !== null}>
            {busy === "confirm" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
            Confirm ({issue.confirmations})
          </Button>
          {issue.status === "reported" && (
            <span className="text-sm text-muted">
              {remaining > 0
                ? `${remaining} more confirmation${remaining === 1 ? "" : "s"} to verify`
                : "Ready to verify"}
            </span>
          )}
          {issue.status === "verified" && (
            <Button variant="secondary" onClick={markProgress} disabled={busy !== null}>
              {busy === "progress" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
              Mark in progress
            </Button>
          )}
        </div>
      )}

      {/* Resolve with AI verification */}
      {!isResolved && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium">Fixed it? Verify the resolution</h3>
          <p className="mt-1 text-sm text-muted">
            Upload an &ldquo;after&rdquo; photo. Our AI compares it with the original to
            confirm the fix.
          </p>
          <input
            ref={proofRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onProof(f);
            }}
          />
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => proofRef.current?.click()}
            disabled={busy !== null}
          >
            {busy === "resolve" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload fix photo
          </Button>
        </div>
      )}

      {/* Verification outcome (just-submitted) */}
      {verification && !verification.resolved && (
        <div className="flex items-start gap-2 rounded-lg border border-sev-med/30 bg-sev-med/10 p-3 text-sm text-sev-med">
          <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />
          <span>AI could not confirm the fix: {verification.note}</span>
        </div>
      )}

      {/* Resolved state */}
      {issue.resolution?.verified && (
        <div className="rounded-lg border border-status-resolved/30 bg-status-resolved/10 p-4">
          <div className="flex items-center gap-2 text-status-resolved">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-medium">AI-verified resolution</span>
          </div>
          {issue.resolution.note && (
            <p className="mt-1 text-sm text-muted">{issue.resolution.note}</p>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/${issue.resolution.proofPath}`}
            alt="Resolution proof"
            className="mt-3 aspect-video w-full rounded-md border border-border object-cover"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-sev-high">{error}</p>
      )}
      {info && (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Info className="h-4 w-4" />
          {info}
        </p>
      )}
    </div>
  );
}
