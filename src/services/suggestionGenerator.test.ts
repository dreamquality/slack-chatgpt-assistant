import { SuggestionGenerator } from "./suggestionGenerator";
import { generateResponse } from "./geminiService";

// Mock the Gemini service
jest.mock("./geminiService");

describe("SuggestionGenerator", () => {
  let suggestionGenerator: SuggestionGenerator;
  let mockGenerateResponse: jest.MockedFunction<typeof generateResponse>;

  beforeEach(() => {
    suggestionGenerator = new SuggestionGenerator();
    mockGenerateResponse = generateResponse as jest.MockedFunction<
      typeof generateResponse
    >;
  });

  describe("generateSuggestions", () => {
    const mockContext = {
      question: "How should I respond to this client request?",
      conversationHistory: [
        "Client: We need this feature by next week",
        "Me: That's a tight deadline, let me check our capacity",
        "Client: It's critical for our launch",
      ],
      participantCount: 3,
      channelType: "public" as const,
    };

    it("should generate suggestions successfully", async () => {
      const mockResponse = {
        content: JSON.stringify([
          {
            type: "template",
            content:
              "I understand this is critical for your launch. Let me work with our team to see what we can deliver by next week.",
            confidence: 0.9,
          },
          {
            type: "clarifying_question",
            content:
              "Can you tell me more about the specific requirements for this feature?",
            confidence: 0.8,
          },
        ]),
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockGenerateResponse.mockResolvedValue(mockResponse);

      const suggestions = await suggestionGenerator.generateSuggestions(
        mockContext
      );

      expect(mockGenerateResponse).toHaveBeenCalledWith(
        expect.stringContaining("How should I respond to this client request?"),
        "suggestion_generator"
      );

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toEqual({
        type: "template",
        content:
          "I understand this is critical for your launch. Let me work with our team to see what we can deliver by next week.",
        confidence: 0.9,
      });
      expect(suggestions[1]).toEqual({
        type: "clarifying_question",
        content:
          "Can you tell me more about the specific requirements for this feature?",
        confidence: 0.8,
      });
    });

    it("should handle invalid JSON response", async () => {
      const mockResponse = {
        content: "Invalid JSON response",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockGenerateResponse.mockResolvedValue(mockResponse);

      const suggestions = await suggestionGenerator.generateSuggestions(
        mockContext
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].type).toBe("template");
      expect(suggestions[1].type).toBe("clarifying_question");
      expect(suggestions[2].type).toBe("summary");
    });

    it("should handle empty response", async () => {
      const mockResponse = {
        content: "",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockGenerateResponse.mockResolvedValue(mockResponse);

      const suggestions = await suggestionGenerator.generateSuggestions(
        mockContext
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].type).toBe("template");
    });

    it("should handle API errors gracefully", async () => {
      mockGenerateResponse.mockRejectedValue(new Error("API Error"));

      const suggestions = await suggestionGenerator.generateSuggestions(
        mockContext
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].type).toBe("template");
      expect(suggestions[0].content).toContain(
        "How should I respond to this client request?"
      );
    });

    it("should filter out invalid suggestions", async () => {
      const mockResponse = {
        content: JSON.stringify([
          {
            type: "template",
            content: "Valid suggestion",
            confidence: 0.9,
          },
          {
            type: "invalid_type",
            content: "Invalid suggestion",
            confidence: 0.5,
          },
          {
            type: "clarifying_question",
            content: "",
            confidence: 0.8,
          },
          {
            type: "summary",
            content: "Another valid suggestion",
            confidence: 1.5, // Invalid confidence
          },
        ]),
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockGenerateResponse.mockResolvedValue(mockResponse);

      const suggestions = await suggestionGenerator.generateSuggestions(
        mockContext
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toEqual({
        type: "template",
        content: "Valid suggestion",
        confidence: 0.9,
      });
    });

    it("should limit suggestions to 4", async () => {
      const mockResponse = {
        content: JSON.stringify([
          { type: "template", content: "Suggestion 1", confidence: 0.9 },
          { type: "improvement", content: "Suggestion 2", confidence: 0.8 },
          {
            type: "clarifying_question",
            content: "Suggestion 3",
            confidence: 0.7,
          },
          { type: "summary", content: "Suggestion 4", confidence: 0.6 },
          { type: "template", content: "Suggestion 5", confidence: 0.5 },
        ]),
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockGenerateResponse.mockResolvedValue(mockResponse);

      const suggestions = await suggestionGenerator.generateSuggestions(
        mockContext
      );

      expect(suggestions).toHaveLength(4);
      expect(suggestions[3].content).toBe("Suggestion 4");
    });
  });

  describe("getSuggestionColor", () => {
    it("should return correct colors for each suggestion type", () => {
      expect(suggestionGenerator.getSuggestionColor("template")).toBe(
        "#36a64f"
      );
      expect(suggestionGenerator.getSuggestionColor("improvement")).toBe(
        "#ff9500"
      );
      expect(
        suggestionGenerator.getSuggestionColor("clarifying_question")
      ).toBe("#007cba");
      expect(suggestionGenerator.getSuggestionColor("summary")).toBe("#6b4c9a");
      expect(suggestionGenerator.getSuggestionColor("unknown" as any)).toBe(
        "#95a5a6"
      );
    });
  });
});
