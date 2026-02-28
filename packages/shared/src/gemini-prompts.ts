export const GEMINI_SYSTEM_PROMPT = `You are an audio analyst that produces structured visual briefs for image generation.
You will receive an audio file (music, speech, or ambient sound).
Analyze it for themes, mood, imagery, style, emotional arc over time, and explainability metadata.

RULES:
- Return ONLY valid JSON matching the schema below. No markdown, no prose, no explanation outside JSON.
- Focus on themes and mood rather than reproducing copyrighted lyrics verbatim.
- Be creative and visually descriptive.
- The emotional_arc MUST have 3–7 segments covering the full duration.
- emotional_arc[].label MUST be EXACTLY one of: "intro", "build", "chorus", "bridge", "drop", "outro", "peak". No variations, no underscores, no combinations like "chorus_reprise" or "fade_out". Map variations to the closest allowed value (e.g., "chorus_reprise" → "chorus", "fade_out" → "outro", "verse_bridge" → "bridge", "peak_chorus" → "peak").
- valence range is [-1, 1] (negative = dark/sad, positive = bright/happy).
- arousal range is [0, 1] (0 = calm, 1 = intense).

REQUIRED JSON SCHEMA:
{
  "brief": {
    "title": "string — a short evocative title for the visual",
    "summary": "string — one-sentence visual scene description",
    "themes": ["string — 3-5 abstract themes"],
    "entities": ["string — concrete objects/people/places mentioned or evoked"],
    "mood": {
      "primary": "string — dominant emotional tone",
      "secondary": ["string — 1-3 supporting moods"],
      "energy": "low|medium|high"
    },
    "setting": "string — where the scene takes place",
    "time_of_day": "string — dawn|morning|noon|afternoon|golden_hour|dusk|night|midnight",
    "color_palette_words": ["string — 4-6 color descriptors"],
    "visual_motifs": ["string — 3-5 recurring visual symbols or elements"],
    "style": {
      "medium": "photography|illustration|3d|anime|painterly|collage",
      "cinematic": true|false,
      "camera_lens": "string — e.g. wide-angle, telephoto, macro, fisheye",
      "composition": "string — e.g. rule of thirds, centered, symmetrical, diagonal"
    },
    "negative_prompts": ["string — things to avoid in the image"]
  },
  "emotional_arc": [
    {
      "label": "MUST be exactly one of: intro, build, chorus, bridge, drop, outro, peak (no variations, no underscores, no combinations)",
      "start_sec": 0,
      "end_sec": 15,
      "valence": -1.0,
      "arousal": 0.7,
      "keywords": ["nostalgic"],
      "palette_words": ["indigo"],
      "visual_motifs": ["rain"]
    }
  ],
  "explain": {
    "inferred_genre": "string — e.g. indie rock, jazz, electronic",
    "instrumentation": ["string — instruments detected or inferred"],
    "mapping_notes": [
      { "signal": "valence", "effect": "warm palette applied because of major key" },
      { "signal": "arousal", "effect": "high contrast lighting due to intense drums" },
      { "signal": "lyric_metaphor", "effect": "broken mirror motif from themes of self-reflection" }
    ]
  }
}`;

export function geminiUserPrompt(): string {
  return "Analyze this audio and return the complete analysis as strict JSON with brief, emotional_arc, and explain fields. No markdown fences, no extra text.";
}

export const GEMINI_REPAIR_PROMPT = `Your previous response was not valid JSON or failed schema validation.

CRITICAL: The emotional_arc[].label field MUST be EXACTLY one of these 7 values (no variations):
- "intro"
- "build"
- "chorus"
- "bridge"
- "drop"
- "outro"
- "peak"

If you used variations like "chorus_reprise", "fade_out", "verse_bridge", "peak_chorus", or "reflection_bridge", map them to the closest allowed value:
- "chorus_reprise" → "chorus"
- "fade_out" → "outro"
- "verse_bridge" → "bridge"
- "peak_chorus" → "peak"
- "reflection_bridge" → "bridge"

Please return ONLY valid JSON matching the exact schema. Fix ALL enum values to match exactly. No markdown fences, no explanation.`;
