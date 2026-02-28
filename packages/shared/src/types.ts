import type { VisualBrief } from "./brief.js";
import type { EmotionalArc } from "./emotional-arc.js";
import type { Explain } from "./explain.js";
import type { StoryboardFrame } from "./storyboard.js";
import type { OutputMode } from "./storyboard.js";
import type { DirectorMode } from "./director.js";

export interface SingleResult {
  image_base64: string;
  image_mime: "image/png" | "image/jpeg";
  prompt: string;
}

export interface GenerateResponse {
  output_mode: OutputMode;
  director_mode: DirectorMode;
  brief: VisualBrief;
  emotional_arc: EmotionalArc;
  explain: Explain;
  single: SingleResult | null;
  storyboard: StoryboardFrame[] | null;
  timings_ms: {
    total: number;
    gemini: number;
    imagen: number;
  };
}
