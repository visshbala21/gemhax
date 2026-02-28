import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY is not set. Add it to the repository .env file before starting the API."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

export interface ImageResult {
  base64: string;
  mime: "image/png" | "image/jpeg";
}

export async function generateImage(prompt: string): Promise<ImageResult> {
  const modelName = process.env.GEMINI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL;
  const model = getGenAI().getGenerativeModel({
    model: modelName,
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const candidates = response.candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error("Imagen returned no candidates");
  }

  // Find the image part in the response
  for (const candidate of candidates) {
    if (!candidate.content?.parts) continue;
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return {
          base64: part.inlineData.data,
          mime: (part.inlineData.mimeType as "image/png" | "image/jpeg") ?? "image/png",
        };
      }
    }
  }

  throw new Error(
    "Imagen response did not contain an image. The model may not support image generation with your current API key."
  );
}
