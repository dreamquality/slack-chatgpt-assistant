import { App } from "@slack/bolt";
import { createSlackApp } from "../config/slack";
import { registerMentionHandler } from "../handlers/mentionHandler";
import { registerConfigHandler } from "../handlers/configHandler";

// Mock all external dependencies
jest.mock("../config/slack");
jest.mock("../handlers/mentionHandler");
jest.mock("../handlers/configHandler");
jest.mock("../services/contextAnalyzer");
jest.mock("../services/chatgptService");
jest.mock("../services/suggestionGenerator");

describe("Integration Tests", () => {
  let mockApp: jest.Mocked<App>;

  beforeEach(() => {
    mockApp = {
      event: jest.fn(),
      command: jest.fn(),
      start: jest.fn(),
    } as any;

    (createSlackApp as jest.Mock).mockReturnValue(mockApp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("App Initialization", () => {
    it("should register all handlers during app initialization", async () => {
      // Import the app to trigger initialization
      await import("../app");

      expect(registerMentionHandler).toHaveBeenCalledWith(mockApp);
      expect(registerConfigHandler).toHaveBeenCalledWith(mockApp);
    });

    it("should start the app on the correct port", async () => {
      process.env.PORT = "3001";

      await import("../app");

      expect(mockApp.start).toHaveBeenCalledWith(3001);
    });

    it("should use default port when PORT env var is not set", async () => {
      delete process.env.PORT;

      await import("../app");

      expect(mockApp.start).toHaveBeenCalledWith(3000);
    });
  });

  describe("Error Handling", () => {
    it("should handle app start errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const processSpy = jest.spyOn(process, "exit").mockImplementation();

      mockApp.start.mockRejectedValue(new Error("Start failed"));

      await import("../app");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to start Slack app:",
        expect.any(Error)
      );
      expect(processSpy).toHaveBeenCalledWith(1);
    });
  });
});
