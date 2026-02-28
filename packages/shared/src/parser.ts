import { briefSchema, type VisualBrief } from "./brief.js";
import { emotionalArcSchema, type EmotionalArc } from "./emotional-arc.js";
import { explainSchema, type Explain } from "./explain.js";
import { z } from "zod";

/** The full Gemini response schema wrapping brief + emotional_arc + explain. */
export const geminiResponseSchema = z.object({
  brief: briefSchema,
  emotional_arc: emotionalArcSchema,
  explain: explainSchema,
});

export interface GeminiAnalysis {
  brief: VisualBrief;
  emotional_arc: EmotionalArc;
  explain: Explain;
}

function cleanJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned;
}

/**
 * Parse and validate Gemini's JSON response into GeminiAnalysis.
 * Strips markdown code fences if present, then validates with zod.
 */
export function parseGeminiResponse(raw: string): GeminiAnalysis {
  const cleaned = cleanJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Gemini did not return valid JSON. Raw response:\n${raw.slice(0, 500)}`
    );
  }

  const result = geminiResponseSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Gemini JSON failed schema validation: ${issues}`);
  }

  return result.data;
}

/**
 * Legacy parser — extracts just the brief for backward compatibility.
 */
export function parseGeminiBrief(raw: string): VisualBrief {
  const cleaned = cleanJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Gemini did not return valid JSON. Raw response:\n${raw.slice(0, 500)}`
    );
  }

  // Try new format first (nested under .brief)
  const obj = parsed as Record<string, unknown>;
  const briefData = obj.brief ?? parsed;

  const result = briefSchema.safeParse(briefData);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Gemini JSON failed schema validation: ${issues}`);
  }

  return result.data;
}
