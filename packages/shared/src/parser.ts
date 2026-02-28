import { briefSchema, type VisualBrief } from "./brief.js";

/**
 * Parse and validate Gemini's JSON response into a VisualBrief.
 * Strips markdown code fences if present, then validates with zod.
 */
export function parseGeminiBrief(raw: string): VisualBrief {
  // Strip markdown code fences if Gemini wraps them
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Gemini did not return valid JSON. Raw response:\n${raw.slice(0, 500)}`
    );
  }

  const result = briefSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Gemini JSON failed schema validation: ${issues}`);
  }

  return result.data;
}
