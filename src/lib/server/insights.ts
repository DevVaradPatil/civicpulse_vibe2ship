import "server-only";
import { db } from "@/lib/server/firebase-admin";
import { getDashboard } from "@/lib/server/stats";
import { generateInsights } from "@/lib/agents/insights";
import type { Insights } from "@/lib/types";

const DOC = db.collection("meta").doc("insights");
const TTL = 30 * 60 * 1000; // 30 min cache

/** Returns cached insights; regenerates via the agent when stale, forced, or missing. */
export async function getInsights(force = false): Promise<Insights> {
  if (!force) {
    const cached = await DOC.get();
    if (cached.exists) {
      const d = cached.data() as Insights;
      if (Date.now() - d.generatedAt < TTL) return d;
    }
  }

  const { stats, hotspots } = await getDashboard();

  // No data yet → skip the AI call (save free-tier quota).
  if (stats.total === 0) {
    return {
      summary: "No issues reported yet. Insights will appear once citizens start reporting.",
      predictions: [],
      generatedAt: Date.now(),
    };
  }

  const generated = await generateInsights(stats, hotspots);
  const insights: Insights = { ...generated, generatedAt: Date.now() };
  await DOC.set(insights);
  return insights;
}
