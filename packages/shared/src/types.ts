import type { VisualBrief } from "./brief.js";

export interface GenerateResponse {
  image_base64: string;
  image_mime: "image/png" | "image/jpeg";
  prompt: string;
  brief: VisualBrief;
  timings_ms: {
    total: number;
    gemini: number;
    imagen: number;
  };
}
