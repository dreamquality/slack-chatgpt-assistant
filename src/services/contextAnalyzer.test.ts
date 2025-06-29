import {
  fetchConversationHistory,
  extractTextAndReactions,
  filterAndCleanMessages,
  summarizeContext,
  ProcessedMessage,
} from "./contextAnalyzer";

// Mock the Slack WebClient
jest.mock("@slack/web-api");

describe("ContextAnalyzer", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      conversations: {
        history: jest.fn(),
        replies: jest.fn(),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchConversationHistory", () => {
    it("should fetch channel history when no thread_ts provided", async () => {
      const mockMessages = [
        { type: "message", user: "U123", text: "Hello", ts: "123" },
      ];
      mockClient.conversations.history.mockResolvedValue({
        messages: mockMessages,
      });

      const result = await fetchConversationHistory(mockClient, {
        channel: "C123",
        limit: 100,
      });

      expect(mockClient.conversations.history).toHaveBeenCalledWith({
        channel: "C123",
        limit: 100,
      });
      expect(result).toEqual(mockMessages);
    });

    it("should fetch thread replies when thread_ts provided", async () => {
      const mockMessages = [
        { type: "message", user: "U123", text: "Reply", ts: "123" },
      ];
      mockClient.conversations.replies.mockResolvedValue({
        messages: mockMessages,
      });

      const result = await fetchConversationHistory(mockClient, {
        channel: "C123",
        thread_ts: "123.456",
        limit: 100,
      });

      expect(mockClient.conversations.replies).toHaveBeenCalledWith({
        channel: "C123",
        ts: "123.456",
        limit: 100,
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe("extractTextAndReactions", () => {
    it("should extract text and reactions from messages", () => {
      const messages = [
        {
          type: "message",
          user: "U123",
          text: "Hello world",
          ts: "123",
          reactions: [{ name: "thumbsup", count: 2 }],
        },
      ];

      const result = extractTextAndReactions(messages);

      expect(result).toEqual([
        {
          user: "U123",
          text: "Hello world",
          ts: "123",
          reactions: ["thumbsup", "thumbsup"],
        },
      ]);
    });

    it("should filter out non-message types", () => {
      const messages = [
        { type: "message", user: "U123", text: "Hello", ts: "123" },
        { type: "bot_message", user: "B123", text: "Bot message", ts: "124" },
      ];

      const result = extractTextAndReactions(messages);

      expect(result).toHaveLength(1);
      expect(result[0].user).toBe("U123");
    });
  });

  describe("filterAndCleanMessages", () => {
    it("should clean text and filter messages", () => {
      const messages = [
        {
          type: "message",
          user: "U123",
          text: "Hello <@U456> how are you?",
          ts: "123",
        },
      ];

      const result = filterAndCleanMessages(messages);

      expect(result).toEqual([
        {
          user: "U123",
          text: "Hello how are you?",
          ts: "123",
          reactions: [],
        },
      ]);
    });
  });

  describe("summarizeContext", () => {
    it("should summarize messages within token limit", () => {
      const messages: ProcessedMessage[] = [
        { user: "U123", text: "Short message", ts: "123", reactions: [] },
        {
          user: "U456",
          text: "Another short message",
          ts: "124",
          reactions: [],
        },
      ];

      const result = summarizeContext(messages, 100);

      expect(result).toContain("[U123] Short message");
      expect(result).toContain("[U456] Another short message");
    });
  });
});
