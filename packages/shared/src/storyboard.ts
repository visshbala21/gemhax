import { z } from "zod";
import type { ArcSegment } from "./emotional-arc.js";

export const outputModeSchema = z.enum(["single", "storyboard"]);
export type OutputMode = z.infer<typeof outputModeSchema>;

export const storyboardFrameSchema = z.object({
  frame: z.enum(["intro", "peak", "resolution"]),
  image_base64: z.string(),
  image_mime: z.enum(["image/png", "image/jpeg"]),
  prompt: z.string(),
});

export type StoryboardFrame = z.infer<typeof storyboardFrameSchema>;

/**
 * Select 3 key frames from the emotional arc:
 * - intro: earliest segment with lowest arousal
 * - peak: segment with highest arousal
 * - resolution: final segment
 */
export function selectStoryboardSegments(
  arc: ArcSegment[]
): { intro: ArcSegment; peak: ArcSegment; resolution: ArcSegment } {
  if (arc.length < 3) {
    throw new Error("Emotional arc must have at least 3 segments for storyboard mode");
  }

  // Sort by start_sec for ordering
  const sorted = [...arc].sort((a, b) => a.start_sec - b.start_sec);

  // Intro: from the first half, pick the one with lowest arousal
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const intro = firstHalf.reduce((min, seg) =>
    seg.arousal < min.arousal ? seg : min
  );

  // Peak: highest arousal segment
  const peak = sorted.reduce((max, seg) =>
    seg.arousal > max.arousal ? seg : max
  );

  // Resolution: final segment
  const resolution = sorted[sorted.length - 1];

  return { intro, peak, resolution };
}
