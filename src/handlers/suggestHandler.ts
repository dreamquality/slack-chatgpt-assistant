import { App } from "@slack/bolt";
import { SuggestionGenerator } from "../services/suggestionGenerator";
import { logger } from "../utils/logger";

export class SuggestHandler {
  private suggestionGenerator: SuggestionGenerator;

  constructor() {
    this.suggestionGenerator = new SuggestionGenerator();
  }

  async handleSuggestCommand(command: any, client: any) {
    const startTime = Date.now();

    logger.info("Received suggest command", {
      channel: command.channel_id,
      user: command.user_id,
      text: command.text?.substring(0, 100),
      action: "handle_suggest_command",
    });

    try {
      const { channel_id, user_id, text } = command;

      // Extract the question from the command
      const question = this.extractQuestion(text);

      if (!question) {
        logger.warn("No question found in suggest command", {
          channel: channel_id,
          user: user_id,
          text: text?.substring(0, 100),
          action: "handle_suggest_command",
        });

        await client.chat.postEphemeral({
          channel: channel_id,
          user: user_id,
          text: "❌ *Error*: Please include a question or request. Usage: `/suggest [your question]`",
        });
        return;
      }

      // Get conversation history
      logger.debug("Fetching conversation history for suggest command", {
        channel: channel_id,
        user: user_id,
        questionLength: question.length,
        action: "fetch_history",
      });

      const history = await client.conversations.history({
        channel: channel_id,
        limit: 50, // Get last 50 messages for context
      });

      if (!history.messages || history.messages.length === 0) {
        logger.warn("No conversation history found for suggest command", {
          channel: channel_id,
          user: user_id,
          action: "fetch_history",
        });

        await client.chat.postEphemeral({
          channel: channel_id,
          user: user_id,
          text: "No conversation history found to analyze.",
        });
        return;
      }

      // Extract conversation context
      const conversationHistory = this.extractConversationHistory(
        history.messages
      );
      const participantCount = this.countParticipants(history.messages);
      const channelType = this.getChannelType(channel_id);

      logger.debug("Extracted conversation context for suggest command", {
        channel: channel_id,
        user: user_id,
        historyLength: conversationHistory.length,
        participantCount,
        channelType,
        action: "extract_context",
      });

      // Generate suggestions
      logger.info("Generating response suggestions for suggest command", {
        channel: channel_id,
        user: user_id,
        questionLength: question.length,
        action: "generate_suggestions",
      });

      const suggestionResult =
        await this.suggestionGenerator.generateSuggestions({
          question,
          conversationHistory,
          participantCount,
          channelType,
        });

      if (suggestionResult.suggestions.length === 0) {
        logger.error("No suggestions generated for suggest command", {
          channel: channel_id,
          user: user_id,
          action: "generate_suggestions",
        });

        await client.chat.postEphemeral({
          channel: channel_id,
          user: user_id,
          text: "❌ *Error*: Unable to generate response suggestions. Please try again later.",
        });
        return;
      }

      // Format suggestions for Slack
      const formattedResponse = this.formatSuggestionsForSlack(
        suggestionResult.suggestions,
        question,
        suggestionResult.isFallback
      );

      logger.debug("Sending response suggestions for suggest command", {
        channel: channel_id,
        user: user_id,
        suggestionCount: suggestionResult.suggestions.length,
        responseLength: formattedResponse.length,
        isFallback: suggestionResult.isFallback,
        action: "send_response",
      });

      // Send response
      await client.chat.postEphemeral({
        channel: channel_id,
        user: user_id,
        text: formattedResponse,
      });

      const duration = Date.now() - startTime;
      logger.info("Successfully handled suggest command", {
        channel: channel_id,
        user: user_id,
        suggestionCount: suggestionResult.suggestions.length,
        isFallback: suggestionResult.isFallback,
        duration,
        action: "handle_suggest_command",
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error handling suggest command", {
        channel: command.channel_id,
        user: command.user_id,
        error: error instanceof Error ? error.message : String(error),
        duration,
        action: "handle_suggest_command",
      });

      // Check for specific API errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      let userMessage =
        "❌ *Error*: Failed to generate response suggestions. Please try again later.";

      if (
        errorMessage.includes("Rate limit exceeded") ||
        errorMessage.includes("429")
      ) {
        userMessage =
          "❌ *API Rate Limit*: Too many requests. Please wait a moment and try again.";
      } else if (
        errorMessage.includes("Service Unavailable") ||
        errorMessage.includes("503")
      ) {
        userMessage =
          "❌ *Service Unavailable*: The AI service is temporarily overloaded. Please try again in a few minutes.";
      } else if (
        errorMessage.includes("quota") ||
        errorMessage.includes("billing")
      ) {
        userMessage =
          "❌ *API Quota Exceeded*: Daily API limit reached. Please try again tomorrow or contact support.";
      }

      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: userMessage,
      });
    }
  }

  private extractQuestion(text: string): string | null {
    if (!text) return null;

    // Clean up the text
    const cleanedText = text
      .replace(/^\s+|\s+$/g, "") // Trim whitespace
      .replace(/\s+/g, " "); // Normalize whitespace

    return cleanedText || null;
  }

  private extractConversationHistory(messages: any[]): string[] {
    return messages
      .filter((message) => !message.bot_id) // Exclude bot messages
      .map((message) => message.text || "")
      .filter((text) => text.trim().length > 0)
      .slice(-10); // Last 10 messages
  }

  private countParticipants(messages: any[]): number {
    const participants = new Set();

    messages.forEach((message) => {
      if (message.user && !message.bot_id) {
        participants.add(message.user);
      }
    });

    return participants.size;
  }

  private getChannelType(channelId: string): "public" | "private" | "direct" {
    if (channelId.startsWith("C")) return "public";
    if (channelId.startsWith("G")) return "private";
    if (channelId.startsWith("D")) return "direct";
    return "public";
  }

  private formatSuggestionsForSlack(
    suggestions: any[],
    question: string,
    isFallback: boolean = false
  ): string {
    let formattedText = "";

    if (isFallback) {
      formattedText += `*❌ API Error - Using Fallback Suggestions*\n\n`;
    }

    formattedText += `*🤖 Response Suggestions*\n\n`;
    formattedText += `*Question:* "${question}"\n\n`;

    suggestions.forEach((suggestion) => {
      const emoji = this.getEmojiForType(suggestion.type);
      const typeLabel = this.getTypeLabel(suggestion.type);
      const confidence = Math.round(suggestion.confidence * 100);

      formattedText += `${emoji} *${typeLabel}* (${confidence}% confidence)\n`;
      formattedText += `${suggestion.content}\n\n`;
    });

    if (isFallback) {
      formattedText +=
        "_⚠️ These are basic fallback suggestions due to API issues. Please try again later for more personalized suggestions._";
    } else {
      formattedText +=
        "_💡 These are suggestions only. Choose the approach that best fits your situation._";
    }

    return formattedText;
  }

  private getEmojiForType(type: string): string {
    switch (type) {
      case "template":
        return "📝";
      case "improvement":
        return "✨";
      case "clarifying_question":
        return "❓";
      case "summary":
        return "📋";
      default:
        return "💡";
    }
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case "template":
        return "Ready-to-Use Template";
      case "improvement":
        return "Improvement Suggestion";
      case "clarifying_question":
        return "Clarifying Question";
      case "summary":
        return "Key Points Summary";
      default:
        return "Suggestion";
    }
  }
}

export function registerSuggestHandler(app: App) {
  const handler = new SuggestHandler();

  logger.info("Registering suggest command handler", {
    command: "/suggest",
    action: "register_suggest_handler",
  });

  app.command("/suggest", async ({ command, ack }) => {
    await ack();
    await handler.handleSuggestCommand(command, app.client);
  });
}
