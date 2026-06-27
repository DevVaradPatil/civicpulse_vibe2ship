import type { MetadataRoute } from "next";

const SITE_URL = "https://civicpulse-245651121772.us-central1.run.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
