import { App } from "@slack/bolt";
import { registerMentionHandler } from "./mentionHandler";

// Mock the privacy utils
jest.mock("../utils/privacyUtils", () => ({
  sendEphemeralMessage: jest.fn(),
}));

describe("MentionHandler", () => {
  let mockApp: jest.Mocked<App>;

  beforeEach(() => {
    mockApp = {
      event: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerMentionHandler", () => {
    it("should register app_mention event handler", () => {
      registerMentionHandler(mockApp);

      expect(mockApp.event).toHaveBeenCalledWith(
        "app_mention",
        expect.any(Function)
      );
    });

    it("should register handler with correct event type", () => {
      registerMentionHandler(mockApp);

      const [eventType, handler] = mockApp.event.mock.calls[0];
      expect(eventType).toBe("app_mention");
      expect(typeof handler).toBe("function");
    });
  });
});
