import type { VisualBrief } from "./brief.js";

const MAX_PROMPT_LENGTH = 1200;

export function composePrompt(brief: VisualBrief): string {
  const parts: string[] = [];

  // Main scene + setting + time
  parts.push(`${brief.summary}.`);
  parts.push(`Setting: ${brief.setting}, ${brief.time_of_day}.`);

  // Motifs
  if (brief.visual_motifs.length > 0) {
    parts.push(`Visual elements: ${brief.visual_motifs.join(", ")}.`);
  }

  // Color palette
  if (brief.color_palette_words.length > 0) {
    parts.push(`Color palette: ${brief.color_palette_words.join(", ")}.`);
  }

  // Mood
  parts.push(
    `Mood: ${brief.mood.primary}, ${brief.mood.secondary.join(", ")}. Energy: ${brief.mood.energy}.`
  );

  // Style
  parts.push(
    `Style: ${brief.style.medium}${brief.style.cinematic ? ", cinematic" : ""}.`
  );
  parts.push(`Lens: ${brief.style.camera_lens}. ${brief.style.composition}.`);

  // Always add safety suffix
  parts.push("No text, no logos, no watermark.");

  let prompt = parts.join(" ");

  // Enforce 1200 char limit
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.slice(0, MAX_PROMPT_LENGTH - 3) + "...";
  }

  return prompt;
}
