import OpenAI from "openai";

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL || "gpt-4",
  maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 2000,
  temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
};

export function createOpenAIClient(): OpenAI {
  if (!openaiConfig.apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  return new OpenAI({
    apiKey: openaiConfig.apiKey,
  });
}
