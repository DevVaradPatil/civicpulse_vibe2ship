import "server-only";
import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";

const BUCKET = process.env.GCS_BUCKET || "civicpulse-v2s-01-media";

// ADC-based auth (same as firebase-admin).
const storage = new Storage();
const bucket = storage.bucket(BUCKET);

/** Uploads an image buffer and returns its GCS object path (kept private; served via /api/media). */
export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  prefix: "issues" | "resolutions",
): Promise<string> {
  const ext = contentType.includes("png") ? "png" : "jpg";
  const objectPath = `${prefix}/${Date.now()}-${randomUUID()}.${ext}`;
  await bucket.file(objectPath).save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
  return objectPath;
}

/** Streams a stored object (used by the /api/media proxy so the bucket stays private). */
export function getFile(objectPath: string) {
  return bucket.file(objectPath);
}

/** Decodes a data URL or bare base64 string into a Buffer + mime type. */
export function decodeImage(input: string, fallbackMime = "image/jpeg") {
  const match = input.match(/^data:(.+?);base64,(.*)$/s);
  if (match) {
    return { buffer: Buffer.from(match[2], "base64"), mimeType: match[1] };
  }
  return { buffer: Buffer.from(input, "base64"), mimeType: fallbackMime };
}
