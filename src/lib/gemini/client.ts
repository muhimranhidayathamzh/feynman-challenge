import "server-only";

import { GoogleGenAI } from "@google/genai";

/**
 * Gemini 2.5 Flash — multimodal model used for both outline generation and
 * (Phase 4) audio evaluation.
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

/**
 * Lazily-instantiated, server-side-only Gemini client.
 * The `server-only` import above makes this module a build error if it is ever
 * imported into a Client Component, keeping GEMINI_API_KEY off the browser.
 */
export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}
