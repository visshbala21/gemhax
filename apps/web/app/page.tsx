"use client";

import { useState, useRef } from "react";

interface Timings {
  total: number;
  gemini: number;
  imagen: number;
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
  style: {
    medium: string;
    cinematic: boolean;
    camera_lens: string;
    composition: string;
  };
  negative_prompts: string[];
}

interface Result {
  image_base64: string;
  image_mime: string;
  prompt: string;
  brief: Brief;
  timings_ms: Timings;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowDetails(false);

    try {
      const formData = new FormData();
      formData.append("audio", file);
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
    const link = document.createElement("a");
    link.href = `data:${result.image_mime};base64,${result.image_base64}`;
    link.download = `lemonade-${title || "artwork"}.png`;
    link.click();
  }

  return (
    <main className="h-screen flex flex-col px-10 py-8 select-none relative overflow-hidden">
      {/* Background prism — hero element, clipped so rainbow doesn't bleed into right panel */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative w-[110vmin] h-[110vmin]" style={{ clipPath: "inset(0 15% 0 0)" }}>
          <img
            src="/prism.jpg"
            alt=""
            className="w-full h-full object-cover opacity-50"
            draggable={false}
          />
        </div>
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_75%)]" />
      </div>

      {/* Header */}
      <header className="flex items-baseline justify-between relative z-10">
        <h1 className="text-6xl font-bold text-[#c8ff00] drop-shadow-[0_0_20px_rgba(200,255,0,0.4)]">
          Lemonade.
        </h1>
        <span className="text-gray-500 text-lg tracking-wider">
          -song to image-
        </span>
      </header>

      {/* Main content */}
      <div className="flex items-center justify-between gap-6 my-auto flex-1 relative z-10 max-w-[1400px] w-full mx-auto">
        {/* Left panel — Music Details */}
        <div className="w-96 shrink-0">
          <div className="relative backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:bg-white/[0.1] hover:border-white/[0.18] hover:shadow-[0_8px_32px_rgba(200,255,0,0.06)]">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <p className="text-[#c8ff00]/80 font-semibold text-sm uppercase tracking-[0.2em] mb-6">
              Music Details
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-5 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.08] transition-all duration-300"
              />

              <input
                type="text"
                placeholder="Artist..."
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-5 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.08] transition-all duration-300"
              />
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <p className="text-white/40 font-medium text-sm uppercase tracking-[0.15em] mb-4">
                Attach Audio
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/[0.06] border border-dashed border-white/[0.15] rounded-xl px-5 py-4 text-base text-white/60 hover:bg-white/[0.1] hover:border-[#c8ff00]/30 hover:text-white/80 transition-all duration-300 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {file ? (
                  <span className="text-[#c8ff00]/80 block truncate">{file.name}</span>
                ) : (
                  "Upload MP3"
                )}
              </button>

              <p className="text-white/20 text-xs mt-3 tracking-wide">
                *Acceptable Formats: mp3, wav, m4a, etc.
              </p>
            </div>

          </div>
        </div>

        {/* Center — Generate button pinned to the triangle centroid */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          {/* The triangle centroid in the album art is ~47% from left, ~48% from top */}
          <div className="absolute" style={{ left: '50%', top: '46%', transform: 'translate(-50%, -50%)' }}>
            <button
              onClick={handleGenerate}
              disabled={!file || loading}
              className="group relative cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-transform duration-500 ease-out hover:scale-110 disabled:hover:scale-100 pointer-events-auto"
              title="Click to generate"
            >
              <div className="relative px-8 py-4 rounded-lg border-2 border-white/40 group-hover:border-[#c8ff00]/80 bg-black/60 backdrop-blur-md flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(200,255,0,0.3)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 border-2 border-[#c8ff00]/80 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm uppercase tracking-[0.2em] text-white/70 font-semibold">
                      Generating...
                    </span>
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

        {/* Right panel — Image */}
        <div className="w-[440px] shrink-0">
          <div className="relative backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:bg-white/[0.1] hover:border-white/[0.18] hover:shadow-[0_8px_32px_rgba(200,255,0,0.06)]">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <p className="text-[#c8ff00]/80 font-semibold text-sm uppercase tracking-[0.2em] mb-5">
              Image
            </p>

            {/* Image frame */}
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-black/40 border border-white/[0.08]">
              {result ? (
                <img
                  src={`data:${result.image_mime};base64,${result.image_base64}`}
                  alt={result.brief?.summary ?? "Generated artwork"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/20 text-lg">
                    {loading ? (
                      <span className="animate-pulse">Generating...</span>
                    ) : (
                      "Image Here"
                    )}
                  </span>
                </div>
              )}

              {/* Expand button (top-right corner of image) */}
              {result && (
                <button
                  onClick={() => setExpanded(true)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-white/50 flex items-center justify-center hover:bg-black/70 hover:text-white/80 cursor-pointer transition-all duration-200"
                  title="Expand image"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="10,2 14,2 14,6" />
                    <polyline points="6,14 2,14 2,10" />
                    <line x1="14" y1="2" x2="9" y2="7" />
                    <line x1="2" y1="14" x2="7" y2="9" />
                  </svg>
                </button>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                onClick={handleDownload}
                disabled={!result}
                className="text-sm text-white/50 hover:text-white/80 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors duration-300 flex items-center gap-1.5"
              >
                <span>&darr;</span> Download
              </button>

              {result && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-3 py-1 rounded-lg border border-white/15 text-white/40 text-xs flex items-center gap-1.5 hover:border-[#c8ff00]/30 hover:text-[#c8ff00]/60 cursor-pointer transition-all duration-300"
                  title="Show image details"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="6" cy="6" r="5" />
                    <line x1="6" y1="5.5" x2="6" y2="8.5" />
                    <circle cx="6" cy="3.8" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                  Details
                </button>
              )}
            </div>

            {/* Details panel */}
            {showDetails && result && (
              <div className="mt-5 bg-black/30 backdrop-blur-sm rounded-xl p-5 text-xs leading-relaxed max-h-60 overflow-auto border border-white/[0.06]">
                <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mb-2">
                  Image Prompt
                </p>
                <p className="text-white/50">{result.prompt}</p>
                {result.brief && (
                  <>
                    <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mt-3 mb-1">
                      Mood
                    </p>
                    <p className="text-white/50">
                      {result.brief.mood?.primary} &middot;{" "}
                      {result.brief.mood?.energy} energy
                    </p>
                    <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mt-3 mb-1">
                      Themes
                    </p>
                    <p className="text-white/50">
                      {result.brief.themes?.join(", ")}
                    </p>
                    <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mt-3 mb-1">
                      Style
                    </p>
                    <p className="text-white/50">
                      {result.brief.style?.medium} &middot;{" "}
                      {result.brief.style?.composition}
                    </p>
                    <p className="text-[#c8ff00]/60 font-semibold uppercase tracking-wider mt-3 mb-1">
                      Timings
                    </p>
                    <p className="text-white/50">
                      Total: {result.timings_ms.total}ms | Gemini:{" "}
                      {result.timings_ms.gemini}ms | Imagen:{" "}
                      {result.timings_ms.imagen}ms
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded image overlay */}
      {expanded && result && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={`data:${result.image_mime};base64,${result.image_base64}`}
              alt={result.brief?.summary ?? "Generated artwork"}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setExpanded(false)}
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
      <footer className="flex items-baseline justify-between pt-6 relative z-10">
        <span className="text-white/20 text-sm">
          an LVJ Technologies production.
        </span>
        <span className="text-sm">
          <span className="text-red-400">P</span>
          <span className="text-orange-400">o</span>
          <span className="text-yellow-400">w</span>
          <span className="text-green-400">e</span>
          <span className="text-blue-400">r</span>
          <span className="text-indigo-400">e</span>
          <span className="text-purple-400">d</span>
          <span className="text-white/30"> by </span>
          <span className="text-red-400">G</span>
          <span className="text-orange-400">e</span>
          <span className="text-yellow-400">m</span>
          <span className="text-green-400">i</span>
          <span className="text-blue-400">n</span>
          <span className="text-indigo-400">i</span>
          <span className="text-white/30"> +</span>
        </span>
      </footer>
    </main>
  );
}
