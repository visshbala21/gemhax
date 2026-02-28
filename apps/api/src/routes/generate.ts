import { Router } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import {
  parseGeminiBrief,
  composePrompt,
  type GenerateResponse,
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

    const { originalname, mimetype, size } = req.file;
    console.log(
      `[${requestId}] Received file: ${originalname} (${mimetype}, ${(size / 1024).toFixed(1)} KB)`
    );

    // Step 1: Gemini audio analysis
    const geminiStart = Date.now();
    const rawBrief = await analyzeAudio(req.file.buffer, mimetype);
    const geminiMs = Date.now() - geminiStart;
    console.log(`[${requestId}] Gemini completed in ${geminiMs}ms`);

    // Step 2: Parse and validate brief
    const brief = parseGeminiBrief(rawBrief);

    // Step 3: Compose prompt
    const prompt = composePrompt(brief);
    console.log(`[${requestId}] Prompt (${prompt.length} chars): ${prompt.slice(0, 100)}...`);

    // Step 4: Generate image with Imagen
    const imagenStart = Date.now();
    const imageResult = await generateImage(prompt);
    const imagenMs = Date.now() - imagenStart;
    console.log(`[${requestId}] Imagen completed in ${imagenMs}ms`);

    const totalMs = Date.now() - start;

    const response: GenerateResponse = {
      image_base64: imageResult.base64,
      image_mime: imageResult.mime,
      prompt,
      brief,
      timings_ms: {
        total: totalMs,
        gemini: geminiMs,
        imagen: imagenMs,
      },
    };

    console.log(`[${requestId}] Total: ${totalMs}ms`);
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
