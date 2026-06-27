import type { MetadataRoute } from "next";

const SITE_URL = "https://civicpulse-245651121772.us-central1.run.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/report", "/map", "/dashboard", "/leaderboard"];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
