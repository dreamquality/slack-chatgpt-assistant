import { createOpenAIClient, openaiConfig } from "../config/openai";
import { ProcessedMessage } from "./contextAnalyzer";

export interface ChatGPTResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ChatGPTError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "ChatGPTError";
  }
}

export async function generateResponse(
  context: string,
  userQuestion: string
): Promise<ChatGPTResponse> {
  const client = createOpenAIClient();

  const prompt = `You are an AI assistant helping with Slack conversations. Analyze the conversation context and provide helpful suggestions for responding to the user's question.

CONVERSATION CONTEXT:
${context}

USER'S QUESTION: ${userQuestion}

INSTRUCTIONS:
- Provide 2-3 different response options
- Be professional and helpful
- Consider the conversation context and tone
- Keep responses concise but informative
- If the context doesn't provide enough information, suggest clarifying questions

Please provide your suggestions:`;

  try {
    const completion = await client.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that analyzes conversation context to provide intelligent response suggestions. Always provide multiple options and be contextually aware.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
    });

    return {
      content:
        completion.choices[0]?.message?.content ||
        "Sorry, I could not generate a response.",
      usage: completion.usage,
    };
  } catch (error: any) {
    console.error("ChatGPT API error:", error);

    if (error.status === 429) {
      throw new ChatGPTError(
        "Rate limit exceeded. Please try again in a moment.",
        "RATE_LIMIT"
      );
    } else if (error.status === 401) {
      throw new ChatGPTError(
        "Authentication failed. Please check your API key.",
        "AUTH_ERROR"
      );
    } else if (error.status === 503) {
      throw new ChatGPTError(
        "Service temporarily unavailable. Please try again later.",
        "SERVICE_UNAVAILABLE"
      );
    } else {
      throw new ChatGPTError(
        "Failed to generate response. Please try again.",
        "API_ERROR"
      );
    }
  }
}
