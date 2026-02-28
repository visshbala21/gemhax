import { z } from "zod";

export const arcSegmentSchema = z.object({
  label: z.enum([
    "intro",
    "build",
    "chorus",
    "bridge",
    "drop",
    "outro",
    "peak",
  ]),
  start_sec: z.number().min(0),
  end_sec: z.number().min(0),
  valence: z.number().min(-1).max(1),
  arousal: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  palette_words: z.array(z.string()),
  visual_motifs: z.array(z.string()),
});

export const emotionalArcSchema = z
  .array(arcSegmentSchema)
  .min(3)
  .max(7);

export type ArcSegment = z.infer<typeof arcSegmentSchema>;
export type EmotionalArc = z.infer<typeof emotionalArcSchema>;
