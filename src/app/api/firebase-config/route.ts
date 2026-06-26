import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Serves the public Firebase web config from server env (set at runtime on Cloud Run),
// so it isn't committed to the repo or baked into the image.
export async function GET() {
  return NextResponse.json(
    {
      apiKey: process.env.FIREBASE_WEB_API_KEY ?? "",
      authDomain:
        process.env.FIREBASE_WEB_AUTH_DOMAIN ??
        `${process.env.FIREBASE_PROJECT_ID ?? ""}.firebaseapp.com`,
      projectId:
        process.env.FIREBASE_WEB_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? "",
      appId: process.env.FIREBASE_WEB_APP_ID ?? "",
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
