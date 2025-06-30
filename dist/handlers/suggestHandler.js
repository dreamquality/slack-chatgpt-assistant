"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestHandler = void 0;
exports.registerSuggestHandler = registerSuggestHandler;
const suggestionGenerator_1 = require("../services/suggestionGenerator");
const logger_1 = require("../utils/logger");
class SuggestHandler {
    constructor() {
        this.suggestionGenerator = new suggestionGenerator_1.SuggestionGenerator();
    }
    async handleSuggestCommand(command, client) {
        const startTime = Date.now();
        logger_1.logger.info("Received suggest command", {
            channel: command.channel_id,
            user: command.user_id,
            text: command.text?.substring(0, 100),
            action: "handle_suggest_command",
        });
        try {
            const { channel_id, user_id, text } = command;
            const question = this.extractQuestion(text);
            if (!question) {
                logger_1.logger.warn("No question found in suggest command", {
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
            logger_1.logger.debug("Fetching conversation history for suggest command", {
                channel: channel_id,
                user: user_id,
                questionLength: question.length,
                action: "fetch_history",
            });
            const history = await client.conversations.history({
                channel: channel_id,
                limit: 50,
            });
            if (!history.messages || history.messages.length === 0) {
                logger_1.logger.warn("No conversation history found for suggest command", {
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
            const conversationHistory = this.extractConversationHistory(history.messages);
            const participantCount = this.countParticipants(history.messages);
            const channelType = this.getChannelType(channel_id);
            logger_1.logger.debug("Extracted conversation context for suggest command", {
                channel: channel_id,
                user: user_id,
                historyLength: conversationHistory.length,
                participantCount,
                channelType,
                action: "extract_context",
            });
            logger_1.logger.info("Generating response suggestions for suggest command", {
                channel: channel_id,
                user: user_id,
                questionLength: question.length,
                action: "generate_suggestions",
            });
            const suggestionResult = await this.suggestionGenerator.generateSuggestions({
                question,
                conversationHistory,
                participantCount,
                channelType,
            });
            if (suggestionResult.suggestions.length === 0) {
                logger_1.logger.error("No suggestions generated for suggest command", {
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
            const formattedResponse = this.formatSuggestionsForSlack(suggestionResult.suggestions, question, suggestionResult.isFallback);
            logger_1.logger.debug("Sending response suggestions for suggest command", {
                channel: channel_id,
                user: user_id,
                suggestionCount: suggestionResult.suggestions.length,
                responseLength: formattedResponse.length,
                isFallback: suggestionResult.isFallback,
                action: "send_response",
            });
            await client.chat.postEphemeral({
                channel: channel_id,
                user: user_id,
                text: formattedResponse,
            });
            const duration = Date.now() - startTime;
            logger_1.logger.info("Successfully handled suggest command", {
                channel: channel_id,
                user: user_id,
                suggestionCount: suggestionResult.suggestions.length,
                isFallback: suggestionResult.isFallback,
                duration,
                action: "handle_suggest_command",
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error("Error handling suggest command", {
                channel: command.channel_id,
                user: command.user_id,
                error: error instanceof Error ? error.message : String(error),
                duration,
                action: "handle_suggest_command",
            });
            const errorMessage = error instanceof Error ? error.message : String(error);
            let userMessage = "❌ *Error*: Failed to generate response suggestions. Please try again later.";
            if (errorMessage.includes("Rate limit exceeded") ||
                errorMessage.includes("429")) {
                userMessage =
                    "❌ *API Rate Limit*: Too many requests. Please wait a moment and try again.";
            }
            else if (errorMessage.includes("Service Unavailable") ||
                errorMessage.includes("503")) {
                userMessage =
                    "❌ *Service Unavailable*: The AI service is temporarily overloaded. Please try again in a few minutes.";
            }
            else if (errorMessage.includes("quota") ||
                errorMessage.includes("billing")) {
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
    extractQuestion(text) {
        if (!text)
            return null;
        const cleanedText = text
            .replace(/^\s+|\s+$/g, "")
            .replace(/\s+/g, " ");
        return cleanedText || null;
    }
    extractConversationHistory(messages) {
        return messages
            .filter((message) => !message.bot_id)
            .map((message) => message.text || "")
            .filter((text) => text.trim().length > 0)
            .slice(-10);
    }
    countParticipants(messages) {
        const participants = new Set();
        messages.forEach((message) => {
            if (message.user && !message.bot_id) {
                participants.add(message.user);
            }
        });
        return participants.size;
    }
    getChannelType(channelId) {
        if (channelId.startsWith("C"))
            return "public";
        if (channelId.startsWith("G"))
            return "private";
        if (channelId.startsWith("D"))
            return "direct";
        return "public";
    }
    formatSuggestionsForSlack(suggestions, question, isFallback = false) {
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
        }
        else {
            formattedText +=
                "_💡 These are suggestions only. Choose the approach that best fits your situation._";
        }
        return formattedText;
    }
    getEmojiForType(type) {
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
    getTypeLabel(type) {
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
exports.SuggestHandler = SuggestHandler;
function registerSuggestHandler(app) {
    const handler = new SuggestHandler();
    logger_1.logger.info("Registering suggest command handler", {
        command: "/suggest",
        action: "register_suggest_handler",
    });
    app.command("/suggest", async ({ command, ack }) => {
        await ack();
        await handler.handleSuggestCommand(command, app.client);
    });
}
//# sourceMappingURL=suggestHandler.js.map