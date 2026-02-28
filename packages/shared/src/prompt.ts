import type { VisualBrief } from "./brief.js";
import type { ArcSegment } from "./emotional-arc.js";
import {
  type DirectorMode,
  DIRECTOR_STYLE_RULES,
} from "./director.js";

const MAX_PROMPT_LENGTH = 1200;

export interface ComposeOptions {
  directorMode?: DirectorMode;
  /** Override segment for storyboard frames (uses segment palette/motifs/mood). */
  arcSegment?: ArcSegment;
  /** Optional custom director instruction appended to the prompt. */
  customDirector?: string;
}

export function composePrompt(
  brief: VisualBrief,
  options: ComposeOptions = {}
): string {
  const { directorMode = "album_cover", arcSegment, customDirector } = options;
  const parts: string[] = [];
  const customMode =
    typeof customDirector === "string" && customDirector.trim().length > 0
      ? customDirector.trim()
      : null;

  // Director mode style rules (always first — strongly influences the image)
  if (customMode) {
    parts.push(`Custom director mode: ${customMode}. Use this as the primary style directive.`);
  } else {
    parts.push(DIRECTOR_STYLE_RULES[directorMode]);
  }

  // Main scene + setting + time
  parts.push(`${brief.summary}.`);
  parts.push(`Setting: ${brief.setting}, ${brief.time_of_day}.`);

  // Use arc segment overrides if provided (storyboard mode)
  const motifs = arcSegment?.visual_motifs ?? brief.visual_motifs;
  const palette = arcSegment?.palette_words ?? brief.color_palette_words;

  // Motifs
  if (motifs.length > 0) {
    parts.push(`Visual elements: ${motifs.join(", ")}.`);
  }

  // Color palette
  if (palette.length > 0) {
    parts.push(`Color palette: ${palette.join(", ")}.`);
  }

  // Mood — use arc segment valence/arousal for lighting cues if available
  if (arcSegment) {
    const valenceDesc =
      arcSegment.valence > 0.3
        ? "warm, inviting lighting"
        : arcSegment.valence < -0.3
          ? "cold, stark lighting with deep shadows"
          : "neutral balanced lighting";
    const arousalDesc =
      arcSegment.arousal > 0.7
        ? "High contrast, dynamic energy"
        : arcSegment.arousal < 0.3
          ? "Soft, diffused, calm"
          : "Moderate intensity";
    parts.push(`${arousalDesc}. ${valenceDesc}.`);
    if (arcSegment.keywords.length > 0) {
      parts.push(`Emotional tone: ${arcSegment.keywords.join(", ")}.`);
    }
  } else {
    parts.push(
      `Mood: ${brief.mood.primary}, ${brief.mood.secondary.join(", ")}. Energy: ${brief.mood.energy}.`
    );
  }

  // Style (from brief, unless director mode already specifies medium)
  if (!customMode && directorMode === "album_cover") {
    parts.push(
      `Style: ${brief.style.medium}${brief.style.cinematic ? ", cinematic" : ""}.`
    );
  }
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
