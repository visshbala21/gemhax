import { describe, it, expect, vi } from "vitest";

// Mock the providers before importing anything
vi.mock("../providers/gemini.js", () => ({
  analyzeAudio: vi.fn().mockResolvedValue(
    JSON.stringify({
      title: "Test Song",
      summary: "A test scene for unit testing",
      themes: ["testing", "automation"],
      entities: ["computer", "code"],
      mood: {
        primary: "focused",
        secondary: ["determined"],
        energy: "medium",
      },
      setting: "Modern office",
      time_of_day: "noon",
      color_palette_words: ["blue", "white", "gray"],
      visual_motifs: ["screens", "keyboards"],
      style: {
        medium: "photography",
        cinematic: false,
        camera_lens: "standard",
        composition: "centered",
      },
      negative_prompts: ["text"],
    })
  ),
}));

vi.mock("../providers/imagen.js", () => ({
  generateImage: vi.fn().mockResolvedValue({
    base64: "dGVzdA==",
    mime: "image/png",
  }),
}));

// We need to test the route logic, but since it's Express, let's test
// the individual components instead
import { parseGeminiBrief, composePrompt } from "@gemhax/shared";

describe("generate route logic", () => {
  it("pipeline: parse brief → compose prompt → valid output", () => {
    const mockGeminiOutput = JSON.stringify({
      title: "Test Song",
      summary: "A test scene for unit testing",
      themes: ["testing", "automation"],
      entities: ["computer", "code"],
      mood: {
        primary: "focused",
        secondary: ["determined"],
        energy: "medium",
      },
      setting: "Modern office",
      time_of_day: "noon",
      color_palette_words: ["blue", "white", "gray"],
      visual_motifs: ["screens", "keyboards"],
      style: {
        medium: "photography",
        cinematic: false,
        camera_lens: "standard",
        composition: "centered",
      },
      negative_prompts: ["text"],
    });

    const brief = parseGeminiBrief(mockGeminiOutput);
    expect(brief.title).toBe("Test Song");

    const prompt = composePrompt(brief);
    expect(prompt).toContain("No text, no logos, no watermark");
    expect(prompt.length).toBeLessThanOrEqual(1200);
  });
});
