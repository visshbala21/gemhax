import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_SYSTEM_PROMPT, geminiUserPrompt } from "@gemhax/shared";

const DEFAULT_ANALYSIS_MODEL = "gemini-2.5-flash";

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY is not set. Add it to the repository .env file before starting the API."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function analyzeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const modelName = process.env.GEMINI_ANALYSIS_MODEL ?? DEFAULT_ANALYSIS_MODEL;
  const model = getGenAI().getGenerativeModel({
    model: modelName,
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
