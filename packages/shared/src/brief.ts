import { z } from "zod";

export const moodSchema = z.object({
  primary: z.string(),
  secondary: z.array(z.string()),
  energy: z.enum(["low", "medium", "high"]),
});

export const styleSchema = z.object({
  medium: z.enum([
    "photography",
    "illustration",
    "3d",
    "anime",
    "painterly",
    "collage",
  ]),
  cinematic: z.boolean(),
  camera_lens: z.string(),
  composition: z.string(),
});

export const briefSchema = z.object({
  title: z.string(),
  summary: z.string(),
  themes: z.array(z.string()),
  entities: z.array(z.string()),
  mood: moodSchema,
  setting: z.string(),
  time_of_day: z.string(),
  color_palette_words: z.array(z.string()),
  visual_motifs: z.array(z.string()),
  style: styleSchema,
  negative_prompts: z.array(z.string()),
});

export type VisualBrief = z.infer<typeof briefSchema>;
