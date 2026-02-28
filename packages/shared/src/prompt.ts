import type { VisualBrief } from "./brief.js";
import type { ArcSegment, EmotionalArc } from "./emotional-arc.js";
import {
  type DirectorMode,
  DIRECTOR_STYLE_RULES,
} from "./director.js";
import type { InterpretationMode } from "./interpretation.js";

const MAX_PROMPT_LENGTH = 1200;

export interface ComposeOptions {
  directorMode?: DirectorMode;
  /** Override segment for storyboard frames (uses segment palette/motifs/mood). */
  arcSegment?: ArcSegment;
  /** Controls whether prompts are literal or abstract. */
  interpretationMode?: InterpretationMode;
  /** Full emotional arc used to emphasize peak segment in abstract mode. */
  emotionalArc?: EmotionalArc;
}

function getPeakSegment(arc?: EmotionalArc): ArcSegment | undefined {
  if (!arc || arc.length === 0) return undefined;
  return arc.reduce((max, seg) => (seg.arousal > max.arousal ? seg : max));
}

export function composePrompt(
  brief: VisualBrief,
  options: ComposeOptions = {}
): string {
  const {
    directorMode = "album_cover",
    arcSegment,
    interpretationMode = "literal",
    emotionalArc,
  } = options;
  const parts: string[] = [];

  // Director mode style rules (always first — strongly influences the image)
  parts.push(DIRECTOR_STYLE_RULES[directorMode]);

  const peakSegment =
    interpretationMode === "abstract" ? getPeakSegment(emotionalArc) : undefined;
  const effectiveSegment = arcSegment ?? peakSegment;

  // Use arc segment overrides if provided (storyboard mode or abstract peak)
  const motifs = effectiveSegment?.visual_motifs ?? brief.visual_motifs;
  const palette = effectiveSegment?.palette_words ?? brief.color_palette_words;
  const toneKeywords = effectiveSegment?.keywords ?? [];

  if (interpretationMode === "literal") {
    parts.push(
      "Cinematic realistic scene with a clear subject and highly legible composition."
    );
    parts.push(`${brief.summary}.`);
    if (brief.entities.length > 0) {
      parts.push(`Key entities: ${brief.entities.join(", ")}.`);
    }
    parts.push(`Setting: ${brief.setting}, ${brief.time_of_day}.`);

    // Motifs
    if (motifs.length > 0) {
      parts.push(`Visual elements: ${motifs.join(", ")}.`);
    }

    // Color palette
    if (palette.length > 0) {
      parts.push(`Color palette: ${palette.join(", ")}.`);
    }

    // Mood — use arc segment valence/arousal for lighting cues if available
    if (effectiveSegment) {
      const valenceDesc =
        effectiveSegment.valence > 0.3
          ? "warm, inviting lighting"
          : effectiveSegment.valence < -0.3
            ? "cold, stark lighting with deep shadows"
            : "neutral balanced lighting";
      const arousalDesc =
        effectiveSegment.arousal > 0.7
          ? "High contrast, dynamic energy"
          : effectiveSegment.arousal < 0.3
            ? "Soft, diffused, calm"
            : "Moderate intensity";
      parts.push(`${arousalDesc}. ${valenceDesc}.`);
      if (toneKeywords.length > 0) {
        parts.push(`Emotional tone: ${toneKeywords.join(", ")}.`);
      }
    } else {
      parts.push(
        `Mood: ${brief.mood.primary}, ${brief.mood.secondary.join(", ")}. Energy: ${brief.mood.energy}.`
      );
    }
  } else {
    parts.push("Symbolic non-literal interpretation; avoid depicting specific literal scenes.");
    parts.push(
      "Express emotion through color, lighting, and composition; surreal or impressionistic rendering."
    );
    parts.push(
      `Mood: ${brief.mood.primary}, ${brief.mood.secondary.join(", ")}. Energy: ${brief.mood.energy}.`
    );
    if (peakSegment) {
      if (peakSegment.keywords.length > 0) {
        parts.push(`Peak emotional tone: ${peakSegment.keywords.join(", ")}.`);
      }
      if (peakSegment.palette_words.length > 0) {
        parts.push(`Peak palette cues: ${peakSegment.palette_words.join(", ")}.`);
      }
    }
    if (palette.length > 0) {
      parts.push(`Palette focus: ${palette.join(", ")}.`);
    }
    parts.push("Focus on atmosphere, texture, contrast, and color fields.");
  }

  // Style (from brief, unless director mode already specifies medium)
  if (directorMode === "album_cover") {
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
