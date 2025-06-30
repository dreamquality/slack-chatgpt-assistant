import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

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
  const startTime = Date.now();
  const maxRetries = 3;

  logger.info("Generating response from Gemini", {
    prompt: prompt.substring(0, 500) + (prompt.length > 500 ? "..." : ""),
    action: "generate_response",
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      logger.info("Raw Gemini response", {
        response: text
          ? text.substring(0, 500) + (text.length > 500 ? "..." : "")
          : "",
        action: "raw_gemini_response",
      });

      const duration = Date.now() - startTime;
      logger.info("Completed Gemini response generation", {
        response: text
          ? text.substring(0, 500) + (text.length > 500 ? "..." : "")
          : "",
        duration,
        responseLength: text.length,
        action: "generate_response",
      });

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
      const duration = Date.now() - startTime;

      if (error.status === 503 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        logger.warn("Gemini API overloaded, retrying", {
          attempt,
          delay,
          error: error.message,
          action: "retry_gemini",
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      logger.error("Failed to generate response from Gemini", {
        error: error instanceof Error ? error.message : String(error),
        duration,
        attempt,
        action: "generate_response",
      });

      if (error.status === 429) {
        throw new GeminiError("Rate limit exceeded");
      } else if (error.status === 401) {
        throw new GeminiError("Authentication failed");
      } else {
        throw new GeminiError("Failed to generate response");
      }
    }
  }

  // If we get here, all retries failed
  throw new GeminiError("Failed to generate response after all retries");
}
