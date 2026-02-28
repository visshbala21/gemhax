# Lemonade

**Upload audio &rarr; AI analyzes it &rarr; generates artwork**

A hackathon project that takes an audio clip (music, speech, ambient sound), uses Google's Gemini API to extract themes, mood, emotional arc, and visual concepts, then uses Imagen to generate artwork — either a single image or a 3-frame storyboard.

![Demo placeholder](https://via.placeholder.com/800x400?text=Lemonade+demo)

## Features

- **Director Mode** — Choose from 6 visual styles: Album Cover, Cinematic Still, Surreal Dream, Anime Frame, Game Concept Art, Minimal Poster
- **Emotional Arc Detection** — Gemini maps the audio's emotional journey over time (valence + arousal), visualized as an interactive SVG timeline
- **Storyboard Mode** — Generates 3 frames (intro, peak, resolution) selected from the emotional arc for a visual narrative
- **Explainability Panel** — See exactly how audio signals mapped to visual choices: genre, instrumentation, and signal-to-effect mappings

## How It Works

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────────┐
│  Upload  │────▶│  Gemini 2.5  │────▶│  Compose   │────▶│  Imagen      │
│  Audio   │     │  Flash       │     │  Prompt(s) │     │  (1 or 3     │
│          │     │              │     │            │     │   images)    │
│  mp3 /   │     │  Returns:    │     │  Director  │     │              │
│  wav /   │     │  • brief     │     │  mode      │     │  Returns:    │
│  m4a     │     │  • emotional │     │  rules +   │     │  base64      │
│          │     │    arc       │     │  arc       │     │  image(s)    │
│          │     │  • explain   │     │  segments  │     │              │
└──────────┘     └──────────────┘     └────────────┘     └──────────────┘
                                                              │
                        ┌─────────────────────────────────────┘
                        ▼
                 ┌──────────────┐
                 │  Response:   │
                 │  • image(s)  │
                 │  • brief     │
                 │  • arc       │
                 │  • explain   │
                 │  • prompts   │
                 │  • timings   │
                 └──────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Google AI API key](https://aistudio.google.com/apikey) with Gemini access

### Setup

```bash
git clone https://github.com/visshbala21/gemhax.git
cd gemhax
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
pnpm install
pnpm dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000

### Demo Script (for judges)

1. Upload a song
2. Choose **Cinematic Still** director mode
3. Click **Generate** — view the single image
4. Scroll down to see the **Emotional Arc** timeline
5. Click **Explain** to see how audio signals mapped to visuals
6. Switch to **Storyboard** mode
7. Click **Generate** again — view the 3-frame narrative (intro → peak → resolution)
8. Expand any frame to view full-size

## Architecture

```
gemhax/
├── apps/
│   ├── web/                       # Next.js frontend (App Router + Tailwind)
│   │   └── app/page.tsx           # Main UI with all panels
│   └── api/                       # Express API server
│       └── src/
│           ├── providers/
│           │   ├── gemini.ts      # Gemini audio analysis + retry
│           │   └── imagen.ts      # Imagen image generation
│           └── routes/
│               └── generate.ts    # POST /generate endpoint
├── packages/
│   └── shared/                    # Shared types, schemas, prompt utilities
│       └── src/
│           ├── brief.ts           # Zod schema for visual brief
│           ├── director.ts        # Director mode enum + style rules
│           ├── emotional-arc.ts   # Arc segment schema + validation
│           ├── explain.ts         # Explainability schema
│           ├── storyboard.ts      # Frame selection logic
│           ├── prompt.ts          # Prompt composer (director + arc aware)
│           ├── parser.ts          # Gemini JSON parser/validator
│           └── gemini-prompts.ts  # System + user + repair prompts
├── .env.example
├── pnpm-workspace.yaml
└── package.json                   # Workspace root
```

## Environment Variables

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | Yes | `apps/api` | Google AI Studio API key for Gemini + Imagen |
| `GEMINI_ANALYSIS_MODEL` | No | `apps/api` | Audio analysis model (default: `gemini-2.5-flash`) |
| `GEMINI_IMAGE_MODEL` | No | `apps/api` | Image generation model (default: `gemini-2.5-flash-image`) |

## API Documentation

### `POST /generate`

Upload an audio file and receive generated image(s) with analysis.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | file | Yes | Audio file (mp3, wav, m4a, up to 25 MB) |
| `director_mode` | string | No | One of: `album_cover`, `cinematic_still`, `surreal_dream`, `anime_frame`, `game_concept_art`, `minimal_poster` (default: `album_cover`) |
| `output_mode` | string | No | `single` or `storyboard` (default: `single`) |
| `interpretation_mode` | string | No | `literal` or `abstract` (default: `literal`) |
| `title` | string | No | Song title (metadata only) |
| `artist` | string | No | Artist name (metadata only) |

**Response:** `application/json`

```json
{
  "output_mode": "single",
  "director_mode": "cinematic_still",
  "interpretation_mode": "literal",
  "brief": {
    "title": "...", "summary": "...", "themes": ["..."],
    "entities": ["..."],
    "mood": { "primary": "...", "secondary": ["..."], "energy": "low|medium|high" },
    "setting": "...", "time_of_day": "...",
    "color_palette_words": ["..."], "visual_motifs": ["..."],
    "style": { "medium": "...", "cinematic": true, "camera_lens": "...", "composition": "..." },
    "negative_prompts": ["..."]
  },
  "emotional_arc": [
    { "label": "intro", "start_sec": 0, "end_sec": 15, "valence": -0.5, "arousal": 0.2,
      "keywords": ["nostalgic"], "palette_words": ["indigo"], "visual_motifs": ["rain"] }
  ],
  "explain": {
    "inferred_genre": "indie rock",
    "instrumentation": ["guitar", "drums"],
    "mapping_notes": [
      { "signal": "valence", "effect": "warm palette applied" }
    ]
  },
  "single": { "image_base64": "...", "image_mime": "image/png", "prompt": "..." },
  "storyboard": null,
  "timings_ms": { "total": 5000, "gemini": 2000, "imagen": 3000 }
}
```

**Example curl:**

```bash
curl -X POST http://localhost:4000/generate \
  -F "audio=@path/to/song.mp3" \
  -F "director_mode=cinematic_still" \
  -F "output_mode=single" \
  | jq '.brief.title, .explain.inferred_genre, .timings_ms'
```

### `GET /health`

Returns `{ "status": "ok" }`.

## Director Modes

| Mode | Visual Style |
|------|-------------|
| `album_cover` | Bold graphic composition, iconic subject, vinyl sleeve aesthetic |
| `cinematic_still` | Anamorphic widescreen, dramatic lighting, film grain, teal-orange grading |
| `surreal_dream` | Impossible geometry, melting forms, Dali-meets-digital, iridescent lighting |
| `anime_frame` | Ghibli-inspired cel shading, vibrant saturated palette, dynamic poses |
| `game_concept_art` | Epic environment painting, atmospheric perspective, Unreal Engine aesthetic |
| `minimal_poster` | Flat geometric shapes, 3-color palette, Swiss design grid, bold negative space |

## Interpretation Modes

- **Literal** — Narrative-grounded visual rendering that prioritizes concrete entities, setting, and clear subject matter.
- **Abstract** — Emotion-grounded symbolic rendering that emphasizes mood, palette, and atmosphere over literal scenes.

**Demo tip:** Generate Literal first, then switch to Abstract to demonstrate contrast.

## Safety & IP

- Gemini focuses on **themes and mood** rather than reproducing copyrighted lyrics
- The visual brief captures the "feel" of audio, not a transcript
- All prompts include "no text, no logos, no watermark"

## Testing

```bash
pnpm test
```

Runs 19 tests: schema validation, prompt composition per director mode, storyboard frame selection, emotional arc parsing, and API pipeline smoke tests.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `GOOGLE_API_KEY not set` | Copy `.env.example` to `.env` and add your key |
| `404 model ... no longer available` | Update to a supported model (or use the defaults in `.env.example`) and restart `pnpm dev` |
| Gemini returns empty response | Ensure your API key has Gemini access enabled |
| Gemini JSON fails validation | The system retries once with a repair prompt automatically |
| Imagen returns no image | Image generation may require specific API access — check [Google AI docs](https://ai.google.dev/) |
| `pnpm dev` fails | Run `pnpm install` first; ensure Node 18+ |
| CORS errors in browser | Make sure the API is running on port 4000 |
| File too large | Audio files must be under 25 MB |

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Express + TypeScript
- **AI:** Google Gemini 2.5 Flash (audio analysis) + Gemini 2.5 Flash Image (image generation)
- **Validation:** Zod
- **Monorepo:** pnpm workspaces

## License

MIT — see [LICENSE](./LICENSE)
