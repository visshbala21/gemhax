import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_SYSTEM_PROMPT, geminiUserPrompt } from "@gemhax/shared";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn("[warn] GOOGLE_API_KEY not set — Gemini calls will fail");
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

export async function analyzeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: GEMINI_SYSTEM_PROMPT,
  });

  const audioPart = {
    inlineData: {
      data: audioBuffer.toString("base64"),
      mimeType,
    },
  };

  const result = await model.generateContent([
    geminiUserPrompt(),
    audioPart,
  ]);

  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}
