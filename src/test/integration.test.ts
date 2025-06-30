import request from "supertest";
import { app } from "../app";
import { PersonalityAnalyzer } from "../services/personalityAnalyzer";
import { GoogleAuthService } from "../auth/googleAuthService";

// Robustly mock @slack/web-api to prevent real network calls and support Bolt initialization
jest.mock("@slack/web-api", () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    chat: {
      postEphemeral: jest.fn().mockResolvedValue({ ok: true }),
      postMessage: jest.fn().mockResolvedValue({ ok: true }),
    },
    users: {
      info: jest.fn().mockResolvedValue({
        ok: true,
        user: {
          id: "U1234567890",
          name: "testuser",
          real_name: "Test User",
        },
      }),
    },
    conversations: {
      history: jest.fn().mockResolvedValue({
        ok: true,
        messages: [],
      }),
    },
    auth: {
      test: jest.fn().mockResolvedValue({
        ok: true,
        user_id: "U1234567890",
        team_id: "T1234567890",
      }),
    },
  })),
  addAppMetadata: jest.fn(), // Needed for Bolt initialization
  PlatformError: class PlatformError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = "PlatformError";
    }
  },
}));

// Mock all external dependencies
jest.mock("../services/personalityAnalyzer");
jest.mock("../auth/googleAuthService");

// Mock the privacy utils to prevent real Slack API calls
jest.mock("../utils/privacyUtils", () => ({
  sendEphemeralMessage: jest.fn().mockResolvedValue({ ok: true }),
}));

describe("Integration Tests", () => {
  beforeAll(async () => {
    // Start the Bolt app on a test port
    await app.start(3001);
  });

  afterAll(async () => {
    // Stop the Bolt app
    await app.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Personality Analysis Integration", () => {
    it("should handle personality analysis command end-to-end", async () => {
      const mockProfiles = [
        {
          userId: "U123",
          userName: "John Doe",
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
        },
      ];

      const mockAnalyzer = PersonalityAnalyzer as jest.MockedClass<
        typeof PersonalityAnalyzer
      >;
      mockAnalyzer.prototype.analyzePersonalities.mockResolvedValue(
        mockProfiles
      );

      const slackEvent = {
        type: "app_mention",
        channel: "C1234567890",
        user: "U1234567890",
        text: "<@BOT_ID> /personality",
        team_id: "T1234567890",
        ts: "1234567890.123456",
      };

      const response = await request("http://localhost:3001")
        .post("/slack/events")
        .send({
          challenge: "test_challenge",
          event: slackEvent,
        })
        .expect(200);

      expect(response.body).toBe("test_challenge");
    });

    it("should handle SSO authentication flow", async () => {
      const mockTokens = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
      };

      const mockUser = {
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      };

      const mockJWT = "mock.jwt.token";

      const mockAuthService = GoogleAuthService as jest.MockedClass<
        typeof GoogleAuthService
      >;
      mockAuthService.prototype.getTokens.mockResolvedValue(mockTokens);
      mockAuthService.prototype.getUserInfo.mockResolvedValue(mockUser);
      mockAuthService.prototype.generateJWT.mockReturnValue(mockJWT);

      const response = await request("http://localhost:3001")
        .get("/auth/google/callback?code=mock_auth_code")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Authentication successful",
        token: mockJWT,
        user: mockUser,
      });
    });

    it("should handle missing authorization code in SSO", async () => {
      const response = await request("http://localhost:3001")
        .get("/auth/google/callback")
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: "Authorization code is required",
      });
    });

    it("should handle logout endpoint", async () => {
      const response = await request("http://localhost:3001")
        .get("/auth/logout")
        .expect(302); // Redirect response

      expect(response.headers.location).toBe("/");
    });

    it("should handle authentication middleware", async () => {
      const response = await request("http://localhost:3001")
        .get("/auth/protected")
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: "No token provided",
      });
    });

    it("should handle valid JWT token", async () => {
      const mockUser = {
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
      };

      const mockAuthService = GoogleAuthService as jest.MockedClass<
        typeof GoogleAuthService
      >;
      mockAuthService.prototype.verifyJWT.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        provider: "google",
      });

      const response = await request("http://localhost:3001")
        .get("/auth/protected")
        .set("Authorization", "Bearer valid.jwt.token")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Protected route accessed successfully",
        user: mockUser,
      });
    });
  });
});
