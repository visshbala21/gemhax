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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);

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

  async function handleSampleAudio() {
    try {
      const res = await fetch("/sample.mp3");
      const blob = await res.blob();
      const sampleFile = new File([blob], "sample.mp3", {
        type: "audio/mpeg",
      });
      setFile(sampleFile);
      setError(null);
    } catch {
      setError("Failed to load sample audio");
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
          gemhax
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Upload audio &rarr; AI analyzes it &rarr; generates artwork
        </p>
      </header>

      {/* Upload Section */}
      <section className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-full border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
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
            {file ? (
              <div>
                <p className="text-purple-400 font-medium">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {(file.size / 1024).toFixed(1)} KB &middot; Click to change
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400">
                  Click to upload audio (mp3, wav, m4a)
                </p>
                <p className="text-gray-600 text-sm mt-1">Max 25 MB</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSampleAudio}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
            >
              Use sample audio
            </button>
            <button
              onClick={handleGenerate}
              disabled={!file || loading}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-gray-400">
            Analyzing audio with Gemini, then generating image with Imagen...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 bg-red-900/30 border border-red-800 rounded-xl p-4">
          <p className="text-red-400 font-medium">Error</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Generated Image */}
          <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">
              {result.brief.title}
            </h2>
            <img
              src={`data:${result.image_mime};base64,${result.image_base64}`}
              alt={result.brief.summary}
              className="w-full rounded-xl"
            />
          </section>

          {/* Timings */}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Total: {result.timings_ms.total}ms</span>
            <span>Gemini: {result.timings_ms.gemini}ms</span>
            <span>Imagen: {result.timings_ms.imagen}ms</span>
          </div>

          {/* Prompt */}
          <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Final Imagen Prompt
            </h3>
            <p className="text-gray-300 text-sm font-mono leading-relaxed">
              {result.prompt}
            </p>
          </section>

          {/* Visual Brief */}
          <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Visual Brief (from Gemini)
            </h3>
            <pre className="text-xs text-gray-400 overflow-auto max-h-96 bg-gray-950 rounded-lg p-4">
              {JSON.stringify(result.brief, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}
