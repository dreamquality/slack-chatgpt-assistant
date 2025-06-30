import { GoogleAuthService, GoogleUser } from "./googleAuthService";

// Mock the google-auth-library
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl: jest
      .fn()
      .mockReturnValue(
        "https://accounts.google.com/oauth2/auth?client_id=test"
      ),
    getToken: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe("GoogleAuthService", () => {
  let authService: GoogleAuthService;
  const mockOAuth2Client = require("google-auth-library").OAuth2Client;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new GoogleAuthService();
  });

  describe("getAuthUrl", () => {
    it("should generate auth URL with correct scopes", () => {
      const authUrl = authService.getAuthUrl();

      expect(authUrl).toBe(
        "https://accounts.google.com/oauth2/auth?client_id=test"
      );
      expect(mockOAuth2Client).toHaveBeenCalledWith(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    });
  });

  describe("getTokens", () => {
    it("should get tokens from authorization code", async () => {
      const mockTokens = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
      };

      const mockGetToken = jest.fn().mockResolvedValue({ tokens: mockTokens });
      mockOAuth2Client.mockImplementation(() => ({
        generateAuthUrl: jest.fn(),
        getToken: mockGetToken,
      }));

      // Recreate the service with the new mock
      authService = new GoogleAuthService();

      const tokens = await authService.getTokens("mock_auth_code");

      expect(mockGetToken).toHaveBeenCalledWith("mock_auth_code");
      expect(tokens).toEqual(mockTokens);
    });
  });

  describe("getUserInfo", () => {
    it("should fetch and parse user info correctly", async () => {
      const mockUserInfo = {
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      };

      (fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockUserInfo),
      });

      const userInfo = await authService.getUserInfo("mock_access_token");

      expect(fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/oauth2/v2/userinfo?access_token=mock_access_token"
      );
      expect(userInfo).toEqual({
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      });
    });

    it("should handle missing picture field", async () => {
      const mockUserInfo = {
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
        // No picture field
      };

      (fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockUserInfo),
      });

      const userInfo = await authService.getUserInfo("mock_access_token");

      expect(userInfo.picture).toBeUndefined();
    });
  });

  describe("generateJWT", () => {
    it("should generate JWT with user data", () => {
      const mockUser: GoogleUser = {
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      };

      const jwt = authService.generateJWT(mockUser);

      expect(typeof jwt).toBe("string");
      expect(jwt.split(".")).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe("verifyJWT", () => {
    it("should verify valid JWT", () => {
      const mockUser: GoogleUser = {
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
      };

      const jwt = authService.generateJWT(mockUser);
      const verified = authService.verifyJWT(jwt);

      expect(verified.userId).toBe("123456789");
      expect(verified.email).toBe("test@example.com");
      expect(verified.name).toBe("Test User");
      expect(verified.provider).toBe("google");
    });

    it("should throw error for invalid JWT", () => {
      expect(() => {
        authService.verifyJWT("invalid.jwt.token");
      }).toThrow();
    });
  });
});
