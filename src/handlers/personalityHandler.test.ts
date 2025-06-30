import { PersonalityHandler } from "./personalityHandler";
import { PersonalityAnalyzer } from "../services/personalityAnalyzer";
import { ProfileGenerator } from "../services/profileGenerator";

// Mock the services
jest.mock("../services/personalityAnalyzer");
jest.mock("../services/profileGenerator");

describe("PersonalityHandler", () => {
  let handler: PersonalityHandler;
  let mockAnalyzer: jest.Mocked<PersonalityAnalyzer>;
  let mockGenerator: jest.Mocked<ProfileGenerator>;

  beforeEach(() => {
    handler = new PersonalityHandler();
    mockAnalyzer =
      new PersonalityAnalyzer() as jest.Mocked<PersonalityAnalyzer>;
    mockGenerator = new ProfileGenerator() as jest.Mocked<ProfileGenerator>;

    // Replace the service instances with mocks
    (handler as any).analyzer = mockAnalyzer;
    (handler as any).generator = mockGenerator;
  });

  describe("handlePersonalityAnalysis", () => {
    const mockSlackEvent = {
      channel: "C1234567890",
      user: "U1234567890",
      text: "/personality",
      team_id: "T1234567890",
    };

    const mockSlackClient = {
      chat: {
        postEphemeral: jest.fn(),
      },
      conversations: {
        history: jest.fn(),
      },
    };

    it("should handle personality analysis successfully", async () => {
      const mockProfiles = [
        {
          userId: "U123",
          userName: "John Doe",
          communicationStyle: "direct",
          emotionalTone: "positive",
          keyTraits: ["friendly"],
          communicationPatterns: {
            responseTime: "fast",
            messageLength: "short",
            formality: "informal",
          },
          role: "supporter",
          preferences: ["quick responses"],
          recommendations: ["Keep being friendly"],
        },
      ];

      const mockReport = {
        text: "🎭 *Personality Profile Analysis*\n\n*John Doe*\nCommunication Style: direct",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🎭 Personality Profile Analysis",
            },
          },
        ],
      };

      mockSlackClient.conversations.history.mockResolvedValue({
        messages: [
          { user: "U123", text: "Hello!", username: "John Doe" },
          { user: "U456", text: "Hi there", username: "Jane Smith" },
        ],
      });

      mockAnalyzer.analyzePersonalities.mockResolvedValue(mockProfiles);
      mockGenerator.generateReport.mockReturnValue(mockReport);

      await handler.handlePersonalityAnalysis(
        mockSlackEvent,
        mockSlackClient as any
      );

      expect(mockAnalyzer.analyzePersonalities).toHaveBeenCalled();
      expect(mockGenerator.generateReport).toHaveBeenCalledWith(mockProfiles);
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: "C1234567890",
        user: "U1234567890",
        text: "*🔒 This response is private and only visible to you*\n\n🎭 *Personality Profile Analysis*\n\n*John Doe*\nCommunication Style: direct",
        blocks: mockReport.blocks,
      });
    });

    it("should handle single participant error", async () => {
      mockSlackClient.conversations.history.mockResolvedValue({
        messages: [{ user: "U123", text: "Hello!", username: "John Doe" }],
      });

      await handler.handlePersonalityAnalysis(
        mockSlackEvent,
        mockSlackClient as any
      );

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: "C1234567890",
        user: "U1234567890",
        text: "❌ *Error*: Cannot analyze personality for a single participant. At least 2 participants are required.",
      });
    });

    it("should handle no profiles found", async () => {
      mockSlackClient.conversations.history.mockResolvedValue({
        messages: [
          { user: "U123", text: "Hello!", username: "John Doe" },
          { user: "U456", text: "Hi there", username: "Jane Smith" },
        ],
      });

      mockAnalyzer.analyzePersonalities.mockResolvedValue([]);

      await handler.handlePersonalityAnalysis(
        mockSlackEvent,
        mockSlackClient as any
      );

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: "C1234567890",
        user: "U1234567890",
        text: "❌ *Error*: No personality profiles could be generated. Please try again later.",
      });
    });

    it("should handle general errors", async () => {
      mockSlackClient.conversations.history.mockRejectedValue(
        new Error("API Error")
      );

      await handler.handlePersonalityAnalysis(
        mockSlackEvent,
        mockSlackClient as any
      );

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: "C1234567890",
        user: "U1234567890",
        text: "❌ *Error*: Failed to analyze personalities. Please try again later.",
      });
    });

    it("should handle missing channel or user", async () => {
      const incompleteEvent = {
        text: "/personality",
        team_id: "T1234567890",
      };

      await handler.handlePersonalityAnalysis(
        incompleteEvent as any,
        mockSlackClient as any
      );

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: undefined,
        user: undefined,
        text: "❌ *Error*: Invalid request. Missing channel or user information.",
      });
    });
  });
});
