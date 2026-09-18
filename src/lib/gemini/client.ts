import "server-only";

import { GoogleGenAI } from "@google/genai";

import { serverEnv } from "@/lib/env";

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

  client = new GoogleGenAI({ apiKey: serverEnv().GEMINI_API_KEY });
  return client;
}
