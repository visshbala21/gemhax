import { Router } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import {
  composePrompt,
  directorModeSchema,
  outputModeSchema,
  selectStoryboardSegments,
  type DirectorMode,
  type OutputMode,
  type GenerateResponse,
  type StoryboardFrame,
} from "@gemhax/shared";
import { analyzeAudio } from "../providers/gemini.js";
import { generateImage } from "../providers/imagen.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

export const generateRoute: Router = Router();

generateRoute.post("/", upload.single("audio"), async (req, res) => {
  const requestId = uuid();
  const start = Date.now();

  try {
    if (!req.file) {
      res.status(400).json({ error: "No audio file uploaded" });
      return;
    }

    // Parse options from form fields
    const directorMode: DirectorMode = directorModeSchema.catch("album_cover").parse(
      req.body?.director_mode
    );
    const outputMode: OutputMode = outputModeSchema.catch("single").parse(
      req.body?.output_mode
    );

    const { originalname, mimetype, size } = req.file;
    console.log(
      `[${requestId}] file=${originalname} (${mimetype}, ${(size / 1024).toFixed(1)} KB) director=${directorMode} output=${outputMode}`
    );

    // Step 1: Gemini audio analysis (returns brief + emotional_arc + explain)
    const geminiStart = Date.now();
    const analysis = await analyzeAudio(req.file.buffer, mimetype);
    const geminiMs = Date.now() - geminiStart;
    console.log(`[${requestId}] Gemini completed in ${geminiMs}ms`);

    const { brief, emotional_arc, explain } = analysis;

    // Step 2: Generate image(s)
    const imagenStart = Date.now();
    let singleResult: GenerateResponse["single"] = null;
    let storyboardResult: StoryboardFrame[] | null = null;

    if (outputMode === "storyboard") {
      // Select 3 key segments from the arc
      const segments = selectStoryboardSegments(emotional_arc);
      const frameEntries = [
        { frame: "intro" as const, segment: segments.intro },
        { frame: "peak" as const, segment: segments.peak },
        { frame: "resolution" as const, segment: segments.resolution },
      ];

      // Generate 3 images with concurrency limit of 3
      const framePromises = frameEntries.map(async ({ frame, segment }) => {
        const prompt = composePrompt(brief, {
          directorMode,
          arcSegment: segment,
        });
        console.log(
          `[${requestId}] Storyboard ${frame} prompt (${prompt.length} chars)`
        );
        const img = await generateImage(prompt);
        return {
          frame,
          image_base64: img.base64,
          image_mime: img.mime,
          prompt,
        } satisfies StoryboardFrame;
      });

      storyboardResult = await Promise.all(framePromises);
    } else {
      // Single image
      const prompt = composePrompt(brief, { directorMode });
      console.log(
        `[${requestId}] Prompt (${prompt.length} chars): ${prompt.slice(0, 100)}...`
      );
      const imageResult = await generateImage(prompt);
      singleResult = {
        image_base64: imageResult.base64,
        image_mime: imageResult.mime,
        prompt,
      };
    }

    const imagenMs = Date.now() - imagenStart;
    const totalMs = Date.now() - start;
    console.log(
      `[${requestId}] Imagen ${imagenMs}ms | Total ${totalMs}ms`
    );

    const response: GenerateResponse = {
      output_mode: outputMode,
      director_mode: directorMode,
      brief,
      emotional_arc,
      explain,
      single: singleResult,
      storyboard: storyboardResult,
      timings_ms: {
        total: totalMs,
        gemini: geminiMs,
        imagen: imagenMs,
      },
    };

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[${requestId}] Error:`, message);
    res.status(500).json({
      error: message,
      requestId,
    });
  }
});
