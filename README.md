# gemhax

**Upload audio → Gemini analyzes it → Imagen generates artwork**

A hackathon project that takes an audio clip (music, speech, ambient sound), uses Google's Gemini API to extract themes, mood, and visual concepts, then uses Imagen to generate a single piece of artwork.

![Demo placeholder](https://via.placeholder.com/800x400?text=gemhax+demo)

## How It Works

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────┐
│  Upload  │────▶│  Gemini 2.0  │────▶│  Compose   │────▶│  Imagen  │
│  Audio   │     │  Flash       │     │  Prompt    │     │          │
│  (mp3/   │     │  (analyze    │     │  (template │     │  (gen    │
│   wav/   │     │   audio →    │     │   + brief  │     │   image) │
│   m4a)   │     │   JSON       │     │   → 1200   │     │          │
│          │     │   brief)     │     │   chars)   │     │          │
└──────────┘     └──────────────┘     └────────────┘     └──────────┘
                                                              │
                        ┌─────────────────────────────────────┘
                        ▼
                 ┌──────────────┐
                 │  Return:     │
                 │  • image     │
                 │  • prompt    │
                 │  • brief     │
                 │  • timings   │
                 └──────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Google AI API key](https://aistudio.google.com/apikey) with Gemini + Imagen access

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

### Usage

1. Open http://localhost:3000
2. Upload an audio file (or click "Use sample audio")
3. Click "Generate"
4. View the generated artwork, Imagen prompt, and Gemini's visual brief

## Architecture

```
gemhax/
├── apps/
│   ├── web/                 # Next.js frontend (App Router + Tailwind)
│   └── api/                 # Express API server
│       └── src/
│           ├── providers/
│           │   ├── gemini.ts   # Gemini audio analysis
│           │   └── imagen.ts   # Imagen image generation
│           └── routes/
│               └── generate.ts # POST /generate endpoint
├── packages/
│   └── shared/              # Shared types, schemas, prompt utilities
│       └── src/
│           ├── brief.ts        # Zod schema for visual brief
│           ├── prompt.ts       # Prompt composer (1200 char limit)
│           ├── parser.ts       # Gemini JSON parser/validator
│           └── gemini-prompts.ts # System + user prompts
├── .env.example
├── pnpm-workspace.yaml
└── package.json             # Workspace root
```

## Environment Variables

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | Yes | `apps/api` | Google AI Studio API key for Gemini + Imagen |
| `GEMINI_ANALYSIS_MODEL` | No | `apps/api` | Audio analysis model (default: `gemini-2.5-flash`) |
| `GEMINI_IMAGE_MODEL` | No | `apps/api` | Image generation model (default: `gemini-2.5-flash-image`) |

## API Documentation

### `POST /generate`

Upload an audio file and receive a generated image.

**Request:** `multipart/form-data`
- `audio` — audio file (mp3, wav, m4a, up to 25 MB)

**Response:** `application/json`
```json
{
  "image_base64": "base64-encoded image data",
  "image_mime": "image/png",
  "prompt": "The final prompt sent to Imagen",
  "brief": {
    "title": "...",
    "summary": "...",
    "themes": ["..."],
    "entities": ["..."],
    "mood": { "primary": "...", "secondary": ["..."], "energy": "low|medium|high" },
    "setting": "...",
    "time_of_day": "...",
    "color_palette_words": ["..."],
    "visual_motifs": ["..."],
    "style": { "medium": "...", "cinematic": true, "camera_lens": "...", "composition": "..." },
    "negative_prompts": ["..."]
  },
  "timings_ms": { "total": 5000, "gemini": 2000, "imagen": 3000 }
}
```

**Example curl:**
```bash
curl -X POST http://localhost:4000/generate \
  -F "audio=@path/to/song.mp3" \
  | jq '.brief.title, .timings_ms'
```

### `GET /health`

Returns `{ "status": "ok" }`.

## Visual Brief Schema

Gemini returns a structured JSON "visual brief" with:
- **title/summary** — evocative scene description
- **themes** — abstract concepts (3-5)
- **entities** — concrete objects/places mentioned
- **mood** — primary + secondary emotions + energy level
- **setting/time_of_day** — scene location and lighting
- **color_palette_words** — color descriptors for the image
- **visual_motifs** — recurring visual symbols
- **style** — medium, cinematic flag, camera lens, composition
- **negative_prompts** — things to exclude from the image

## Safety & IP

- Gemini is instructed to focus on **themes and mood** rather than reproducing copyrighted lyrics verbatim
- The visual brief captures the "feel" of audio, not a transcript
- All generated images include "no text, no logos, no watermark" in the prompt

## Testing

```bash
pnpm test
```

Runs shared schema validation tests and API smoke tests (mocked, no API key needed).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `GOOGLE_API_KEY not set` | Copy `.env.example` to `.env` and add your key |
| `404 model ... no longer available` | Update to a supported model (or use the defaults in `.env.example`) and restart `pnpm dev` |
| Gemini returns empty response | Ensure your API key has Gemini access enabled |
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
