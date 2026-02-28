import { describe, it, expect } from "vitest";
import { briefSchema } from "../brief.js";
import { composePrompt } from "../prompt.js";
import { parseGeminiBrief } from "../parser.js";

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

  it("throws on invalid JSON", () => {
    expect(() => parseGeminiBrief("not json")).toThrow("valid JSON");
  });

  it("throws on schema mismatch", () => {
    expect(() => parseGeminiBrief('{"title":"x"}')).toThrow("schema validation");
  });
});
