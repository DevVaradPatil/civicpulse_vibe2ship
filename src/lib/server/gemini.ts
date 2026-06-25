import "server-only";
import { GoogleGenAI } from "@google/genai";

// Gemini via Google AI Studio (free tier). Server-side only — key never reaches the client.
// gemini-2.0-flash is zeroed on the free tier; 2.5-flash has live free quota and is multimodal.
export const MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

/** Lazily constructs the client so build/static analysis doesn't warn about a missing key. */
export function getAI(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
  }
  return client;
}

export function geminiReady(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
