import { SSOHandler } from "./ssoHandler";
import { GoogleAuthService } from "../auth/googleAuthService";

// Mock the GoogleAuthService
jest.mock("../auth/googleAuthService");

describe("SSOHandler", () => {
  let handler: SSOHandler;
  let mockAuthService: jest.Mocked<GoogleAuthService>;

  beforeEach(() => {
    handler = new SSOHandler();
    mockAuthService = new GoogleAuthService() as jest.Mocked<GoogleAuthService>;

    // Replace the service instance with mock
    (handler as any).authService = mockAuthService;
  });

  describe("handleSSO", () => {
    const mockRequest = {
      query: {
        code: "mock_auth_code",
      },
    };

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    it("should handle successful SSO authentication", async () => {
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

      mockAuthService.getTokens.mockResolvedValue(mockTokens);
      mockAuthService.getUserInfo.mockResolvedValue(mockUser);
      mockAuthService.generateJWT.mockReturnValue(mockJWT);

      await handler.handleSSO(mockRequest as any, mockResponse as any);

      expect(mockAuthService.getTokens).toHaveBeenCalledWith("mock_auth_code");
      expect(mockAuthService.getUserInfo).toHaveBeenCalledWith(
        "mock_access_token"
      );
      expect(mockAuthService.generateJWT).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Authentication successful",
        token: mockJWT,
        user: mockUser,
      });
    });

    it("should handle missing authorization code", async () => {
      const requestWithoutCode = {
        query: {},
      };

      await handler.handleSSO(requestWithoutCode as any, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Authorization code is required",
      });
    });

    it("should handle token exchange error", async () => {
      mockAuthService.getTokens.mockRejectedValue(
        new Error("Token exchange failed")
      );

      await handler.handleSSO(mockRequest as any, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to exchange authorization code for tokens",
      });
    });

    it("should handle user info fetch error", async () => {
      const mockTokens = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
      };

      mockAuthService.getTokens.mockResolvedValue(mockTokens);
      mockAuthService.getUserInfo.mockRejectedValue(
        new Error("Failed to fetch user info")
      );

      await handler.handleSSO(mockRequest as any, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to exchange authorization code for tokens",
      });
    });

    it("should handle JWT generation error", async () => {
      const mockTokens = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
      };

      const mockUser = {
        id: "123456789",
        email: "test@example.com",
        name: "Test User",
      };

      mockAuthService.getTokens.mockResolvedValue(mockTokens);
      mockAuthService.getUserInfo.mockResolvedValue(mockUser);
      mockAuthService.generateJWT.mockImplementation(() => {
        throw new Error("JWT generation failed");
      });

      await handler.handleSSO(mockRequest as any, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to exchange authorization code for tokens",
      });
    });
  });

  describe("handleLogout", () => {
    const mockRequest = {};
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    it("should handle logout successfully", async () => {
      await handler.handleLogout(mockRequest as any, mockResponse as any);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Logout successful",
      });
    });
  });
});
