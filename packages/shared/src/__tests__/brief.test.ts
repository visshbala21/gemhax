import { describe, it, expect } from "vitest";
import { briefSchema } from "../brief.js";
import { composePrompt } from "../prompt.js";
import { parseGeminiBrief, parseGeminiResponse } from "../parser.js";
import { selectStoryboardSegments } from "../storyboard.js";
import type { ArcSegment } from "../emotional-arc.js";
import type { DirectorMode } from "../director.js";
import { DIRECTOR_STYLE_RULES } from "../director.js";

const validBrief = {
  title: "Neon Rain",
  summary: "A lone figure walks through a neon-lit rainy street at night",
  themes: ["solitude", "urban life", "reflection"],
  entities: ["person", "street", "neon signs", "rain"],
  mood: {
    primary: "melancholic",
    secondary: ["contemplative", "peaceful"],
    energy: "low" as const,
  },
  setting: "Tokyo side street with glowing signs",
  time_of_day: "night",
  color_palette_words: ["neon blue", "pink", "deep purple", "wet asphalt gray"],
  visual_motifs: ["reflections", "rain drops", "glowing signs"],
  style: {
    medium: "photography" as const,
    cinematic: true,
    camera_lens: "wide-angle",
    composition: "rule of thirds",
  },
  negative_prompts: ["text", "logos", "watermark"],
};

const validArc: ArcSegment[] = [
  { label: "intro", start_sec: 0, end_sec: 15, valence: -0.5, arousal: 0.2, keywords: ["nostalgic"], palette_words: ["indigo"], visual_motifs: ["rain"] },
  { label: "build", start_sec: 15, end_sec: 45, valence: 0.0, arousal: 0.5, keywords: ["rising"], palette_words: ["amber"], visual_motifs: ["fire"] },
  { label: "chorus", start_sec: 45, end_sec: 90, valence: 0.8, arousal: 0.9, keywords: ["euphoric"], palette_words: ["gold"], visual_motifs: ["sun"] },
  { label: "bridge", start_sec: 90, end_sec: 120, valence: -0.2, arousal: 0.4, keywords: ["reflective"], palette_words: ["gray"], visual_motifs: ["mirror"] },
  { label: "outro", start_sec: 120, end_sec: 150, valence: 0.3, arousal: 0.3, keywords: ["peaceful"], palette_words: ["soft blue"], visual_motifs: ["sky"] },
];

const validExplain = {
  inferred_genre: "indie rock",
  instrumentation: ["electric guitar", "drums", "synth"],
  mapping_notes: [
    { signal: "valence", effect: "warm palette applied" },
    { signal: "arousal", effect: "high contrast lighting" },
  ],
};

const validFullResponse = {
  brief: validBrief,
  emotional_arc: validArc,
  explain: validExplain,
};

describe("briefSchema", () => {
  it("validates a correct brief", () => {
    const result = briefSchema.safeParse(validBrief);
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const { title, ...rest } = validBrief;
    const result = briefSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid energy value", () => {
    const bad = { ...validBrief, mood: { ...validBrief.mood, energy: "extreme" } };
    const result = briefSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe("composePrompt", () => {
  it("produces a prompt under 1200 chars", () => {
    const prompt = composePrompt(validBrief);
    expect(prompt.length).toBeLessThanOrEqual(1200);
    expect(prompt).toContain("No text, no logos, no watermark");
  });

  it("includes director mode style rules", () => {
    const modes: DirectorMode[] = [
      "album_cover",
      "cinematic_still",
      "surreal_dream",
      "anime_frame",
      "game_concept_art",
      "minimal_poster",
    ];
    for (const mode of modes) {
      const prompt = composePrompt(validBrief, { directorMode: mode });
      expect(prompt).toContain(DIRECTOR_STYLE_RULES[mode].slice(0, 20));
    }
  });

  it("produces visibly different prompts per director mode", () => {
    const cinematic = composePrompt(validBrief, { directorMode: "cinematic_still" });
    const anime = composePrompt(validBrief, { directorMode: "anime_frame" });
    const surreal = composePrompt(validBrief, { directorMode: "surreal_dream" });
    expect(cinematic).not.toEqual(anime);
    expect(anime).not.toEqual(surreal);
    expect(cinematic).toContain("Cinematic film still");
    expect(anime).toContain("Anime key frame");
    expect(surreal).toContain("Surrealist dreamscape");
  });

  it("uses arc segment overrides for storyboard frames", () => {
    const prompt = composePrompt(validBrief, {
      directorMode: "album_cover",
      arcSegment: validArc[0],
    });
    expect(prompt).toContain("rain");
    expect(prompt).toContain("indigo");
    expect(prompt).toContain("nostalgic");
  });
});

describe("parseGeminiBrief", () => {
  it("parses valid JSON", () => {
    const result = parseGeminiBrief(JSON.stringify(validBrief));
    expect(result.title).toBe("Neon Rain");
  });

  it("strips markdown fences", () => {
    const wrapped = "```json\n" + JSON.stringify(validBrief) + "\n```";
    const result = parseGeminiBrief(wrapped);
    expect(result.title).toBe("Neon Rain");
  });

  it("parses new nested format", () => {
    const result = parseGeminiBrief(JSON.stringify({ brief: validBrief }));
    expect(result.title).toBe("Neon Rain");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseGeminiBrief("not json")).toThrow("valid JSON");
  });

  it("throws on schema mismatch", () => {
    expect(() => parseGeminiBrief('{"title":"x"}')).toThrow("schema validation");
  });
});

describe("parseGeminiResponse", () => {
  it("parses full response with brief + arc + explain", () => {
    const result = parseGeminiResponse(JSON.stringify(validFullResponse));
    expect(result.brief.title).toBe("Neon Rain");
    expect(result.emotional_arc).toHaveLength(5);
    expect(result.explain.inferred_genre).toBe("indie rock");
  });

  it("throws if emotional_arc has < 3 segments", () => {
    const bad = { ...validFullResponse, emotional_arc: validArc.slice(0, 2) };
    expect(() => parseGeminiResponse(JSON.stringify(bad))).toThrow("schema validation");
  });
});

describe("selectStoryboardSegments", () => {
  it("selects intro (low arousal), peak (high arousal), resolution (last)", () => {
    const { intro, peak, resolution } = selectStoryboardSegments(validArc);
    expect(intro.label).toBe("intro"); // arousal 0.2, lowest in first half
    expect(peak.label).toBe("chorus"); // arousal 0.9, highest
    expect(resolution.label).toBe("outro"); // last segment
  });

  it("throws with fewer than 3 segments", () => {
    expect(() => selectStoryboardSegments(validArc.slice(0, 2))).toThrow(
      "at least 3 segments"
    );
  });
});
