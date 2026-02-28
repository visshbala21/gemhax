import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey ?? "");

export interface ImageResult {
  base64: string;
  mime: "image/png" | "image/jpeg";
}

export async function generateImage(prompt: string): Promise<ImageResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      // @ts-expect-error — responseModalities is supported but not yet in types
      responseModalities: ["image", "text"],
    },
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
