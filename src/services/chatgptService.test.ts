import { generateResponse, ChatGPTError } from "./chatgptService";

// Mock the OpenAI client
const mockCreateCompletion = jest.fn();
jest.mock("../config/openai", () => ({
  createOpenAIClient: jest.fn(() => ({
    chat: {
      completions: {
        create: mockCreateCompletion,
      },
    },
  })),
  openaiConfig: {
    model: "gpt-4",
    maxTokens: 2000,
    temperature: 0.7,
  },
}));

describe("ChatGPTService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateResponse", () => {
    it("should generate response successfully", async () => {
      const mockCompletion = {
        choices: [
          {
            message: {
              content: "Here are some suggestions for your response...",
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockCreateCompletion.mockResolvedValue(mockCompletion);

      const result = await generateResponse("Test context", "Test question");

      expect(mockCreateCompletion).toHaveBeenCalledWith({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: expect.stringContaining("helpful assistant"),
          },
          {
            role: "user",
            content: expect.stringContaining("Test context"),
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      expect(result).toEqual({
        content: "Here are some suggestions for your response...",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });
    });

    it("should handle rate limit errors", async () => {
      const rateLimitError = new Error("Rate limit exceeded");
      (rateLimitError as any).status = 429;
      mockCreateCompletion.mockRejectedValue(rateLimitError);

      await expect(
        generateResponse("Test context", "Test question")
      ).rejects.toThrow("Rate limit exceeded");
    });

    it("should handle authentication errors", async () => {
      const authError = new Error("Authentication failed");
      (authError as any).status = 401;
      mockCreateCompletion.mockRejectedValue(authError);

      await expect(
        generateResponse("Test context", "Test question")
      ).rejects.toThrow("Authentication failed");
    });

    it("should return fallback message when no content", async () => {
      const mockCompletion = {
        choices: [{}],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 0,
          total_tokens: 100,
        },
      };

      mockCreateCompletion.mockResolvedValue(mockCompletion);

      const result = await generateResponse("Test context", "Test question");

      expect(result.content).toBe("Sorry, I could not generate a response.");
    });
  });

  describe("ChatGPTError", () => {
    it("should create error with message and code", () => {
      const error = new ChatGPTError("Test error", "TEST_CODE");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("ChatGPTError");
    });
  });
});
