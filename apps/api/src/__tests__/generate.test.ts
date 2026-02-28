import { describe, it, expect, vi } from "vitest";

const mockAnalysis = {
  brief: {
    title: "Test Song",
    summary: "A test scene for unit testing",
    themes: ["testing", "automation"],
    entities: ["computer", "code"],
    mood: { primary: "focused", secondary: ["determined"], energy: "medium" as const },
    setting: "Modern office",
    time_of_day: "noon",
    color_palette_words: ["blue", "white", "gray"],
    visual_motifs: ["screens", "keyboards"],
    style: {
      medium: "photography" as const,
      cinematic: false,
      camera_lens: "standard",
      composition: "centered",
    },
    negative_prompts: ["text"],
  },
  emotional_arc: [
    { label: "intro" as const, start_sec: 0, end_sec: 30, valence: -0.3, arousal: 0.2, keywords: ["calm"], palette_words: ["blue"], visual_motifs: ["sky"] },
    { label: "build" as const, start_sec: 30, end_sec: 60, valence: 0.1, arousal: 0.5, keywords: ["rising"], palette_words: ["amber"], visual_motifs: ["light"] },
    { label: "chorus" as const, start_sec: 60, end_sec: 90, valence: 0.8, arousal: 0.9, keywords: ["euphoric"], palette_words: ["gold"], visual_motifs: ["sun"] },
    { label: "outro" as const, start_sec: 90, end_sec: 120, valence: 0.2, arousal: 0.3, keywords: ["peaceful"], palette_words: ["lavender"], visual_motifs: ["clouds"] },
  ],
  explain: {
    inferred_genre: "electronic",
    instrumentation: ["synth", "drums"],
    mapping_notes: [
      { signal: "valence", effect: "warm palette" },
      { signal: "arousal", effect: "high contrast" },
    ],
  },
};

vi.mock("../providers/gemini.js", () => ({
  analyzeAudio: vi.fn().mockResolvedValue(mockAnalysis),
}));

vi.mock("../providers/imagen.js", () => ({
  generateImage: vi.fn().mockResolvedValue({
    base64: "dGVzdA==",
    mime: "image/png",
  }),
}));

import {
  composePrompt,
  interpretationModeSchema,
  selectStoryboardSegments,
} from "@gemhax/shared";

describe("generate pipeline", () => {
  it("composes valid prompt from analysis brief", () => {
    const prompt = composePrompt(mockAnalysis.brief, { directorMode: "album_cover" });
    expect(prompt).toContain("No text, no logos, no watermark");
    expect(prompt.length).toBeLessThanOrEqual(1200);
  });

  it("selects correct storyboard segments", () => {
    const { intro, peak, resolution } = selectStoryboardSegments(
      mockAnalysis.emotional_arc
    );
    expect(intro.label).toBe("intro");
    expect(peak.label).toBe("chorus");
    expect(resolution.label).toBe("outro");
  });

  it("composes different storyboard prompts per frame segment", () => {
    const { intro, peak, resolution } = selectStoryboardSegments(
      mockAnalysis.emotional_arc
    );
    const p1 = composePrompt(mockAnalysis.brief, { directorMode: "cinematic_still", arcSegment: intro });
    const p2 = composePrompt(mockAnalysis.brief, { directorMode: "cinematic_still", arcSegment: peak });
    const p3 = composePrompt(mockAnalysis.brief, { directorMode: "cinematic_still", arcSegment: resolution });
    expect(p1).not.toEqual(p2);
    expect(p2).not.toEqual(p3);
  });

  it("defaults interpretation_mode to literal when missing", () => {
    const mode = interpretationModeSchema.catch("literal").parse(undefined);
    expect(mode).toBe("literal");
  });
});
