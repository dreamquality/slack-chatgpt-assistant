import { generateResponse, GeminiError } from "./geminiService";

// Mock the Google Generative AI SDK
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}));

describe("GeminiService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateResponse", () => {
    it("should generate a successful response", async () => {
      const mockResponse = {
        response: {
          text: () => "Test response from Gemini",
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
          },
        },
      };

      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResponse),
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      }));

      const result = await generateResponse("Test prompt");

      expect(result.content).toBe("Test response from Gemini");
      expect(result.usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      });
    });

    it("should handle rate limit errors", async () => {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue({ status: 429 }),
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      }));

      await expect(generateResponse("Test prompt")).rejects.toThrow(
        GeminiError
      );
      await expect(generateResponse("Test prompt")).rejects.toThrow(
        "Rate limit exceeded"
      );
    });

    it("should handle authentication errors", async () => {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue({ status: 401 }),
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      }));

      await expect(generateResponse("Test prompt")).rejects.toThrow(
        GeminiError
      );
      await expect(generateResponse("Test prompt")).rejects.toThrow(
        "Authentication failed"
      );
    });

    it("should handle general API errors", async () => {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error("API Error")),
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      }));

      await expect(generateResponse("Test prompt")).rejects.toThrow(
        GeminiError
      );
      await expect(generateResponse("Test prompt")).rejects.toThrow(
        "Failed to generate response"
      );
    });

    it("should handle empty response", async () => {
      const mockResponse = {
        response: {
          text: () => "",
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 0,
          },
        },
      };

      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResponse),
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      }));

      const result = await generateResponse("Test prompt");

      expect(result.content).toBe("Sorry, I could not generate a response.");
    });
  });
});
