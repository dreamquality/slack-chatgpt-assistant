"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionHandler = void 0;
exports.registerMentionHandler = registerMentionHandler;
const suggestionGenerator_1 = require("../services/suggestionGenerator");
const logger_1 = require("../utils/logger");
const privacyUtils_1 = require("../utils/privacyUtils");
class MentionHandler {
    constructor() {
        this.suggestionGenerator = new suggestionGenerator_1.SuggestionGenerator();
    }
    async handleMention(event, client) {
        const startTime = Date.now();
        logger_1.logger.info("Received mention", {
            channel: event.channel,
            user: event.user,
            text: event.text?.substring(0, 100),
            action: "handle_mention",
        });
        try {
            const { channel, user, text, thread_ts } = event;
            const question = this.extractQuestion(text);
            if (!question) {
                logger_1.logger.warn("No question found in mention", {
                    channel,
                    user,
                    text: text?.substring(0, 100),
                    action: "handle_mention",
                });
                await client.chat.postEphemeral({
                    channel,
                    user,
                    text: "❌ *Error*: Please include a question or request in your mention.",
                });
                return;
            }
            logger_1.logger.debug("Fetching conversation history for mention", {
                channel,
                user,
                questionLength: question.length,
                action: "fetch_history",
            });
            const history = await client.conversations.history({
                channel,
                limit: 50,
                ...(thread_ts && { thread_ts }),
            });
            if (!history.messages || history.messages.length === 0) {
                logger_1.logger.warn("No conversation history found for mention", {
                    channel,
                    user,
                    action: "fetch_history",
                });
                await client.chat.postEphemeral({
                    channel,
                    user,
                    text: "No conversation history found to analyze.",
                });
                return;
            }
            const conversationHistory = this.extractConversationHistory(history.messages);
            const participantCount = this.countParticipants(history.messages);
            const channelType = this.getChannelType(channel);
            logger_1.logger.debug("Extracted conversation context", {
                channel,
                user,
                historyLength: conversationHistory.length,
                participantCount,
                channelType,
                action: "extract_context",
            });
            logger_1.logger.info("Generating response suggestions for mention", {
                channel,
                user,
                questionLength: question.length,
                action: "generate_suggestions",
            });
            const suggestions = await this.suggestionGenerator.generateSuggestions({
                question,
                conversationHistory,
                participantCount,
                channelType,
            });
            if (suggestions.length === 0) {
                logger_1.logger.error("No suggestions generated for mention", {
                    channel,
                    user,
                    action: "generate_suggestions",
                });
                await client.chat.postEphemeral({
                    channel,
                    user,
                    text: "❌ *Error*: Unable to generate response suggestions. Please try again later.",
                });
                return;
            }
            const formattedResponse = this.formatSuggestionsForSlack(suggestions, question);
            logger_1.logger.debug("Sending response suggestions for mention", {
                channel,
                user,
                suggestionCount: suggestions.length,
                responseLength: formattedResponse.length,
                action: "send_response",
            });
            await client.chat.postEphemeral({
                channel,
                user,
                text: formattedResponse,
                thread_ts,
            });
            const duration = Date.now() - startTime;
            logger_1.logger.info("Successfully handled mention", {
                channel,
                user,
                suggestionCount: suggestions.length,
                duration,
                action: "handle_mention",
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error("Error handling mention", {
                channel: event.channel,
                user: event.user,
                error: error instanceof Error ? error.message : String(error),
                duration,
                action: "handle_mention",
            });
            await client.chat.postEphemeral({
                channel: event.channel,
                user: event.user,
                text: "❌ *Error*: Failed to generate response suggestions. Please try again later.",
                thread_ts: event.thread_ts,
            });
        }
    }
    extractQuestion(text) {
        if (!text)
            return null;
        const cleanedText = text
            .replace(/<@[A-Z0-9]+>/g, "")
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
    formatSuggestionsForSlack(suggestions, question) {
        const privacyText = (0, privacyUtils_1.createPrivacyIndicator)();
        let formattedText = `${privacyText}\n\n`;
        formattedText += `*🤖 Response Suggestions*\n\n`;
        formattedText += `*Question:* "${question}"\n\n`;
        suggestions.forEach((suggestion) => {
            const emoji = this.getEmojiForType(suggestion.type);
            const typeLabel = this.getTypeLabel(suggestion.type);
            const confidence = Math.round(suggestion.confidence * 100);
            formattedText += `${emoji} *${typeLabel}* (${confidence}% confidence)\n`;
            formattedText += `${suggestion.content}\n\n`;
        });
        formattedText +=
            "_💡 These are suggestions only. Choose the approach that best fits your situation._";
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
exports.MentionHandler = MentionHandler;
function registerMentionHandler(app) {
    const handler = new MentionHandler();
    logger_1.logger.info("Registering mention handler", {
        action: "register_mention_handler",
    });
    app.event("app_mention", async ({ event, client }) => {
        await handler.handleMention(event, client);
    });
}
//# sourceMappingURL=mentionHandler.js.map