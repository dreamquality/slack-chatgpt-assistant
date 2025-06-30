import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function generateResponse(
  prompt: string,
  _userId?: string
): Promise<GeminiResponse> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return {
        content: "Sorry, I could not generate a response.",
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    }

    const usageMetadata = response.usageMetadata;
    return {
      content: text,
      usage: {
        prompt_tokens: usageMetadata?.promptTokenCount || 0,
        completion_tokens: usageMetadata?.candidatesTokenCount || 0,
        total_tokens:
          (usageMetadata?.promptTokenCount || 0) +
          (usageMetadata?.candidatesTokenCount || 0),
      },
    };
  } catch (error: any) {
    if (error.status === 429) {
      throw new GeminiError("Rate limit exceeded");
    } else if (error.status === 401) {
      throw new GeminiError("Authentication failed");
    } else {
      throw new GeminiError("Failed to generate response");
    }
  }
}
