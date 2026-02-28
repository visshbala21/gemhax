"use client";

import { useState, useRef } from "react";

/* ── types ── */
interface ArcSegment {
  label: string;
  start_sec: number;
  end_sec: number;
  valence: number;
  arousal: number;
  keywords: string[];
  palette_words: string[];
  visual_motifs: string[];
}

interface MappingNote {
  signal: string;
  effect: string;
}

interface Explain {
  inferred_genre: string;
  instrumentation: string[];
  mapping_notes: MappingNote[];
}

interface Brief {
  title: string;
  summary: string;
  themes: string[];
  entities: string[];
  mood: { primary: string; secondary: string[]; energy: string };
  setting: string;
  time_of_day: string;
  color_palette_words: string[];
  visual_motifs: string[];
  style: { medium: string; cinematic: boolean; camera_lens: string; composition: string };
  negative_prompts: string[];
}

interface StoryboardFrame {
  frame: string;
  image_base64: string;
  image_mime: string;
  prompt: string;
}

interface Result {
  output_mode: string;
  director_mode: string;
  brief: Brief;
  emotional_arc: ArcSegment[];
  explain: Explain;
  single: { image_base64: string; image_mime: string; prompt: string } | null;
  storyboard: StoryboardFrame[] | null;
  timings_ms: { total: number; gemini: number; imagen: number };
}

type DirectorMode =
  | "album_cover"
  | "cinematic_still"
  | "surreal_dream"
  | "anime_frame"
  | "game_concept_art"
  | "minimal_poster"
  | "custom";

const DIRECTOR_LABELS: Record<DirectorMode, string> = {
  album_cover: "Album Cover",
  cinematic_still: "Cinematic Still",
  surreal_dream: "Surreal Dream",
  anime_frame: "Anime Frame",
  game_concept_art: "Game Concept Art",
  minimal_poster: "Minimal Poster",
  custom: "Custom",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/* ── Emotional Arc SVG ── */
function EmotionalArcGraph({ arc }: { arc: ArcSegment[] }) {
  const W = 600, H = 160, PAD = 32;
  const sorted = [...arc].sort((a, b) => a.start_sec - b.start_sec);
  const maxSec = sorted[sorted.length - 1]?.end_sec || 1;

  const x = (sec: number) => PAD + ((sec / maxSec) * (W - PAD * 2));
  const y = (arousal: number) => H - PAD - (arousal * (H - PAD * 2));

  // Valence → color: negative = blue, positive = warm
  const valColor = (v: number) => {
    if (v > 0.3) return "#c8ff00";
    if (v > 0) return "#fbbf24";
    if (v > -0.3) return "#8b5cf6";
    return "#3b82f6";
  };

  const points = sorted.map((s) => ({
    cx: x((s.start_sec + s.end_sec) / 2),
    cy: y(s.arousal),
    seg: s,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.cy}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: 400 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line key={v} x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="white" strokeOpacity={0.06} />
        ))}

        {/* Y-axis labels */}
        <text x={4} y={y(1) + 4} fill="white" fillOpacity={0.3} fontSize={9}>High</text>
        <text x={4} y={y(0) + 4} fill="white" fillOpacity={0.3} fontSize={9}>Low</text>

        {/* Area fill */}
        <path
          d={`${linePath} L ${points[points.length - 1]?.cx ?? 0} ${y(0)} L ${points[0]?.cx ?? 0} ${y(0)} Z`}
          fill="url(#arcGrad)"
          fillOpacity={0.15}
        />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#c8ff00" strokeWidth={2} strokeOpacity={0.7} />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r={5} fill={valColor(p.seg.valence)} stroke="black" strokeWidth={1} />
            <text x={p.cx} y={H - 6} textAnchor="middle" fill="white" fillOpacity={0.4} fontSize={8}>
              {p.seg.label}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8ff00" />
            <stop offset="100%" stopColor="#c8ff00" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ── Main ── */
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [directorMode, setDirectorMode] = useState<DirectorMode>("album_cover");
  const [customDirector, setCustomDirector] = useState("");
  const [outputMode, setOutputMode] = useState<"single" | "storyboard">("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showArc, setShowArc] = useState(false);
  const [expandedImg, setExpandedImg] = useState<{ base64: string; mime: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowDetails(false);
    setShowExplain(false);
    setShowArc(false);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("director_mode", directorMode);
      formData.append("output_mode", outputMode);
      if (directorMode === "custom" && customDirector.trim()) {
        formData.append("custom_director", customDirector.trim());
      }
      if (title) formData.append("title", title);
      if (artist) formData.append("artist", artist);

      const res = await fetch(`${API_URL}/generate`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error: ${res.status}`);
      }

      const data: Result = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    if (result.single) {
      dl(result.single.image_base64, result.single.image_mime, `lemonade-${title || "artwork"}.png`);
    } else if (result.storyboard) {
      result.storyboard.forEach((f) =>
        dl(f.image_base64, f.image_mime, `lemonade-${f.frame}.png`)
      );
    }
  }

  function dl(base64: string, mime: string, filename: string) {
    const link = document.createElement("a");
    link.href = `data:${mime};base64,${base64}`;
    link.download = filename;
    link.click();
  }


  return (
    <main className="h-screen flex flex-col px-10 pt-4 pb-2 select-none relative overflow-hidden">
      {/* Background prism */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-start justify-center">
        <div
          className="relative w-[110vmin] h-[110vmin]"
          style={{ clipPath: "inset(0 24% 0 0)", transform: "translateY(10vh)" }}
        >
          <img src="/prism.jpg" alt="" className="w-full h-full object-cover opacity-50" draggable={false} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_75%)]" />
      </div>

      {/* Header */}
      <header className="flex items-baseline justify-between relative z-10 mb-2 mt-4">
        <h1 className="text-5xl font-bold text-[#c8ff00] drop-shadow-[0_0_20px_rgba(200,255,0,0.4)] translate-x-[30px] translate-y-[30px]">
          Lemonade.
        </h1>
        <div className="rounded-full border border-white/15 bg-black/35 backdrop-blur-md px-4 py-2 text-right -translate-x-[20px] translate-y-[20px]">
          <p className="text-[10px] leading-none tracking-[0.28em] uppercase text-[#c8ff00]/80">
            Spectral Transmuter
          </p>
          <p className="text-xs leading-none tracking-[0.2em] uppercase text-white/40 mt-1">
            audio -&gt; lightform
          </p>
        </div>
      </header>

      {/* Center — Generate button inside prism */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <div className="relative" style={{ transform: "translateY(12vh)" }}>
            <button
              onClick={handleGenerate} disabled={!file || loading}
              className="group relative cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-transform duration-500 ease-out hover:scale-110 disabled:hover:scale-100 pointer-events-auto"
              title="Click to generate"
            >
              <div className="relative px-5 py-2.5 rounded-md border border-white/40 group-hover:border-[#c8ff00]/80 bg-black/60 backdrop-blur-md flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(200,255,0,0.3)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 border-2 border-[#c8ff00]/80 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm uppercase tracking-[0.2em] text-white/70 font-semibold">Generating...</span>
                  </span>
                ) : (
                  <span className="text-sm uppercase tracking-[0.2em] text-white/80 group-hover:text-[#c8ff00] font-semibold transition-colors duration-300">
                    Generate
                  </span>
                )}
              </div>
            </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-between gap-6 mt-auto mb-auto flex-1 relative z-10 max-w-[1400px] w-full mx-auto overflow-y-auto py-2">
        {/* Left panel — Music Details */}
        <div className="w-96 shrink-0">
          <div className="relative backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:bg-white/[0.1] hover:border-white/[0.18] hover:shadow-[0_8px_32px_rgba(200,255,0,0.06)]">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <p className="text-[#c8ff00]/80 font-semibold text-sm uppercase tracking-[0.2em] mb-6">
              Music Details
            </p>

            <div className="space-y-4">
              <input
                type="text" placeholder="Title..." value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-5 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.08] transition-all duration-300"
              />
              <input
                type="text" placeholder="Artist..." value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-5 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.08] transition-all duration-300"
              />
            </div>

            {/* Director Mode */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <p className="text-white/40 font-medium text-sm uppercase tracking-[0.15em] mb-3">
                Director Mode
              </p>
              <select
                value={directorMode}
                onChange={(e) => {
                  const next = e.target.value as DirectorMode;
                  setDirectorMode(next);
                  if (next !== "custom") setCustomDirector("");
                }}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-5 py-3 text-base text-white outline-none focus:border-[#c8ff00]/40 transition-all duration-300 cursor-pointer appearance-none"
              >
                {(Object.keys(DIRECTOR_LABELS) as DirectorMode[]).map((m) => (
                  <option key={m} value={m} className="bg-gray-900 text-white">
                    {DIRECTOR_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Director */}
            {directorMode === "custom" && (
              <div className="mt-4">
                <p className="text-white/40 font-medium text-sm uppercase tracking-[0.15em] mb-3">
                  Custom Director
                </p>
                <textarea
                  rows={3}
                  placeholder="Describe the style you want (e.g., neon noir, floating shards, dramatic fog...)"
                  value={customDirector}
                  onChange={(e) => setCustomDirector(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.08] transition-all duration-300 resize-none"
                />
                <p className="text-white/25 text-[11px] mt-2 tracking-wide">
                  Required for Custom mode. This becomes the primary style directive.
                </p>
              </div>
            )}

            {/* Output Mode Toggle */}
            <div className="mt-4">
              <p className="text-white/40 font-medium text-sm uppercase tracking-[0.15em] mb-3">
                Output
              </p>
              <div className="flex rounded-xl overflow-hidden border border-white/[0.1]">
                {(["single", "storyboard"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setOutputMode(m)}
                    className={`flex-1 py-2.5 text-sm uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      outputMode === m
                        ? "bg-[#c8ff00]/20 text-[#c8ff00] font-semibold"
                        : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
                    }`}
                  >
                    {m === "single" ? "Single" : "Storyboard"}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Upload */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <p className="text-white/40 font-medium text-sm uppercase tracking-[0.15em] mb-4">
                Attach Audio
              </p>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/[0.06] border border-dashed border-white/[0.15] rounded-xl px-5 py-4 text-base text-white/60 hover:bg-white/[0.1] hover:border-[#c8ff00]/30 hover:text-white/80 transition-all duration-300 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {file ? <span className="text-[#c8ff00]/80 block truncate">{file.name}</span> : "Upload MP3"}
              </button>
              <p className="text-white/20 text-xs mt-3 tracking-wide">*Acceptable Formats: mp3, wav, m4a, etc.</p>
            </div>
          </div>
        </div>

        {/* Right panel — Results */}
        <div className="w-[480px] shrink-0 space-y-4">
          {/* Image Panel */}
          <div className="relative backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:bg-white/[0.1] hover:border-white/[0.18] hover:shadow-[0_8px_32px_rgba(200,255,0,0.06)]">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <p className="text-[#c8ff00]/80 font-semibold text-sm uppercase tracking-[0.2em] mb-5">
              {result?.storyboard ? "Storyboard" : "Image"}
            </p>

            {/* Single image */}
            {(!result || result.single) && (
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-black/40 border border-white/[0.08]">
                {result?.single ? (
                  <img
                    src={`data:${result.single.image_mime};base64,${result.single.image_base64}`}
                    alt={result.brief?.summary ?? "Generated artwork"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/20 text-lg">
                      {loading ? <span className="animate-pulse">Generating...</span> : "Image Here"}
                    </span>
                  </div>
                )}
                {result?.single && (
                  <button
                    onClick={() => setExpandedImg({ base64: result.single!.image_base64, mime: result.single!.image_mime })}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-white/50 flex items-center justify-center hover:bg-black/70 hover:text-white/80 cursor-pointer transition-all duration-200"
                    title="Expand image"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="10,2 14,2 14,6" /><polyline points="6,14 2,14 2,10" />
                      <line x1="14" y1="2" x2="9" y2="7" /><line x1="2" y1="14" x2="7" y2="9" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Storyboard — 3-frame gallery */}
            {result?.storyboard && (
              <div className="grid grid-cols-3 gap-3">
                {result.storyboard.map((f) => (
                  <div key={f.frame} className="flex flex-col items-center gap-2">
                    <div
                      className="relative rounded-xl overflow-hidden aspect-square bg-black/40 border border-white/[0.08] cursor-pointer hover:border-[#c8ff00]/40 transition-all"
                      onClick={() => setExpandedImg({ base64: f.image_base64, mime: f.image_mime })}
                    >
                      <img
                        src={`data:${f.image_mime};base64,${f.image_base64}`}
                        alt={f.frame}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-white/40 text-xs uppercase tracking-wider">{f.frame}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions row */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <button onClick={handleDownload} disabled={!result}
                className="text-sm text-white/50 hover:text-white/80 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors duration-300 flex items-center gap-1.5"
              >
                <span>&darr;</span> Download
              </button>
              {result && (
                <>
                  <button onClick={() => setShowDetails(!showDetails)}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/40 text-xs flex items-center gap-1.5 hover:border-[#c8ff00]/30 hover:text-[#c8ff00]/60 cursor-pointer transition-all duration-300"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="6" cy="6" r="5" /><line x1="6" y1="5.5" x2="6" y2="8.5" />
                      <circle cx="6" cy="3.8" r="0.5" fill="currentColor" stroke="none" />
                    </svg>
                    Details
                  </button>
                  <button onClick={() => setShowExplain(!showExplain)}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/40 text-xs flex items-center gap-1.5 hover:border-[#c8ff00]/30 hover:text-[#c8ff00]/60 cursor-pointer transition-all duration-300"
                  >
                    Explain
                  </button>
                  <button
                    onClick={() => setShowArc(!showArc)}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/40 text-xs flex items-center gap-1.5 hover:border-[#c8ff00]/30 hover:text-[#c8ff00]/60 cursor-pointer transition-all duration-300"
                  >
                    Emotional Arc
                  </button>
                </>
              )}
            </div>

            {/* Details panel */}
            {showDetails && result && (
              <div className="mt-5 bg-black/30 backdrop-blur-sm rounded-xl p-5 text-xs leading-relaxed max-h-60 overflow-auto border border-white/[0.06]">
                <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mb-2">Prompt</p>
                <p className="text-white/50">
                  {result.single?.prompt ?? result.storyboard?.map((f) => `[${f.frame}] ${f.prompt}`).join("\n\n")}
                </p>
                <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mt-3 mb-1">Mood</p>
                <p className="text-white/50">{result.brief.mood?.primary} &middot; {result.brief.mood?.energy} energy</p>
                <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mt-3 mb-1">Themes</p>
                <p className="text-white/50">{result.brief.themes?.join(", ")}</p>
                <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mt-3 mb-1">Timings</p>
                <p className="text-white/50">
                  Total: {result.timings_ms.total}ms | Gemini: {result.timings_ms.gemini}ms | Imagen: {result.timings_ms.imagen}ms
                </p>
              </div>
            )}
          </div>

          {/* Emotional Arc */}
          {showArc && result?.emotional_arc && (
            <div className="relative backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <p className="text-[#c8ff00]/80 font-semibold text-sm uppercase tracking-[0.2em] mb-3">
                Emotional Arc
              </p>
              <p className="text-white/30 text-xs mb-2">Y = arousal | Color = valence (green=positive, blue=negative)</p>
              <EmotionalArcGraph arc={result.emotional_arc} />
            </div>
          )}

          {/* Explainability Panel */}
          {showExplain && result?.explain && (
            <div className="relative backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <p className="text-[#c8ff00]/80 font-semibold text-sm uppercase tracking-[0.2em] mb-4">
                Explainability
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-white/40 uppercase tracking-wider mb-1">Inferred Genre</p>
                  <p className="text-white/70">{result.explain.inferred_genre}</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase tracking-wider mb-1">Instrumentation</p>
                  <p className="text-white/70">{result.explain.instrumentation.join(", ")}</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase tracking-wider mb-1">Signal &rarr; Visual Mapping</p>
                  <div className="space-y-1.5 mt-1">
                    {result.explain.mapping_notes.map((n, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-[#c8ff00]/60 font-semibold shrink-0 w-28">{n.signal}</span>
                        <span className="text-white/50">{n.effect}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final prompts in explainability */}
                <div>
                  <p className="text-white/40 uppercase tracking-wider mb-1 mt-2">Final Prompt(s)</p>
                  {result.single && (
                    <p className="text-white/50 leading-relaxed">{result.single.prompt}</p>
                  )}
                  {result.storyboard?.map((f) => (
                    <div key={f.frame} className="mt-1">
                      <span className="text-[#c8ff00]/50 font-semibold">[{f.frame}]</span>
                      <p className="text-white/50 leading-relaxed">{f.prompt}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-white/40 uppercase tracking-wider mb-1 mt-2">Timings</p>
                  <p className="text-white/50">
                    Total: {result.timings_ms.total}ms | Gemini: {result.timings_ms.gemini}ms | Imagen: {result.timings_ms.imagen}ms
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded image overlay */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setExpandedImg(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={`data:${expandedImg.mime};base64,${expandedImg.base64}`}
              alt="Expanded artwork"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setExpandedImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white/70 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-all"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-4 max-w-lg">
          <p className="text-red-400 text-base">{error}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-baseline justify-between pb-4 relative z-10">
        <span className="text-white/20 text-sm translate-x-[30px] -translate-y-[30px]">an LVJ Technologies production.</span>
        <span className="text-sm -translate-x-[30px] -translate-y-[30px]">
          <span className="text-red-400">P</span><span className="text-orange-400">o</span>
          <span className="text-yellow-400">w</span><span className="text-green-400">e</span>
          <span className="text-blue-400">r</span><span className="text-indigo-400">e</span>
          <span className="text-purple-400">d</span><span className="text-white/30"> by </span>
          <span className="text-red-400">G</span><span className="text-orange-400">e</span>
          <span className="text-yellow-400">m</span><span className="text-green-400">i</span>
          <span className="text-blue-400">n</span><span className="text-indigo-400">i</span>
          <span className="text-white/30"> +</span>
        </span>
      </footer>
    </main>
  );
}
