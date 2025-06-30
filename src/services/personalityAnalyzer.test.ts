import {
  PersonalityAnalyzer,
  ConversationParticipant,
} from "./personalityAnalyzer";
import { generateResponse } from "./geminiService";

// Mock the Gemini service
jest.mock("./geminiService", () => ({
  generateResponse: jest.fn(),
}));

describe("PersonalityAnalyzer", () => {
  let analyzer: PersonalityAnalyzer;
  const mockGenerateResponse = generateResponse as jest.MockedFunction<
    typeof generateResponse
  >;

  beforeEach(() => {
    analyzer = new PersonalityAnalyzer();
    jest.clearAllMocks();
  });

  describe("analyzePersonalities", () => {
    const mockParticipants: ConversationParticipant[] = [
      {
        userId: "U123",
        userName: "John Doe",
        messageCount: 5,
        messages: ["Hello!", "How are you?", "Great to see you!"],
      },
      {
        userId: "U456",
        userName: "Jane Smith",
        messageCount: 3,
        messages: ["Hi there", "I'm doing well", "Thanks!"],
      },
    ];

    it("should analyze multiple participants successfully", async () => {
      const mockGeminiResponse = {
        content: JSON.stringify({
          communicationStyle: "direct, informal",
          emotionalTone: "positive",
          keyTraits: ["friendly", "helpful"],
          communicationPatterns: {
            responseTime: "fast",
            messageLength: "short",
            formality: "informal",
          },
          role: "supporter",
          preferences: ["quick responses"],
          recommendations: ["Keep being friendly"],
        }),
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockGenerateResponse.mockResolvedValue(mockGeminiResponse);

      const profiles = await analyzer.analyzePersonalities(mockParticipants);

      expect(profiles).toHaveLength(2);
      expect(profiles[0].userName).toBe("John Doe");
      expect(profiles[0].communicationStyle).toBe("direct, informal");
      expect(profiles[0].emotionalTone).toBe("positive");
      expect(mockGenerateResponse).toHaveBeenCalledTimes(2);
    });

    it("should throw error for single participant", async () => {
      const singleParticipant = [mockParticipants[0]];

      await expect(
        analyzer.analyzePersonalities(singleParticipant)
      ).rejects.toThrow("Cannot analyze personality for a single participant");
    });

    it("should handle Gemini API errors gracefully", async () => {
      mockGenerateResponse.mockRejectedValue(new Error("API Error"));

      const profiles = await analyzer.analyzePersonalities(mockParticipants);

      // Should return empty array when all participants fail
      expect(profiles).toHaveLength(0);
    });

    it("should handle invalid JSON responses", async () => {
      mockGenerateResponse.mockResolvedValue({
        content: "Invalid JSON response",
        usage: {
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15,
        },
      });

      const profiles = await analyzer.analyzePersonalities(mockParticipants);

      expect(profiles).toHaveLength(2);
      expect(profiles[0].communicationStyle).toBe("unknown");
      expect(profiles[0].emotionalTone).toBe("neutral");
      expect(profiles[0].keyTraits).toEqual([]);
    });

    it("should provide default values for missing fields", async () => {
      const mockGeminiResponse = {
        content: JSON.stringify({
          communicationStyle: "direct",
          // Missing other fields
        }),
        usage: {
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15,
        },
      };

      mockGenerateResponse.mockResolvedValue(mockGeminiResponse);

      const profiles = await analyzer.analyzePersonalities(mockParticipants);

      expect(profiles[0].emotionalTone).toBe("neutral");
      expect(profiles[0].keyTraits).toEqual([]);
      expect(profiles[0].role).toBe("participant");
      expect(profiles[0].communicationPatterns.responseTime).toBe("unknown");
    });
  });
});
