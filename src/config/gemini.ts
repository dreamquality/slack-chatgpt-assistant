import { GoogleGenerativeAI } from "@google/generative-ai";

export const geminiConfig = {
  apiKey: process.env.GOOGLE_AI_API_KEY!,
  model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
  maxTokens: Number(process.env.GEMINI_MAX_TOKENS) || 2048,
  temperature: Number(process.env.GEMINI_TEMPERATURE) || 0.7,
};

export function createGeminiClient(): GoogleGenerativeAI {
  if (!geminiConfig.apiKey) {
    throw new Error("GOOGLE_AI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(geminiConfig.apiKey);
}
