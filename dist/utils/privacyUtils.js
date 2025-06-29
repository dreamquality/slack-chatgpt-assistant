"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEphemeralMessage = sendEphemeralMessage;
exports.isPrivateChannel = isPrivateChannel;
exports.sanitizeMessageForPrivacy = sanitizeMessageForPrivacy;
exports.createSuggestionAttachments = createSuggestionAttachments;
exports.handleSuggestionAction = handleSuggestionAction;
exports.createModificationPrompt = createModificationPrompt;
exports.createContextIndicator = createContextIndicator;
exports.createLoadingMessage = createLoadingMessage;
exports.createLoadingAttachments = createLoadingAttachments;
exports.createErrorMessage = createErrorMessage;
exports.createErrorAttachments = createErrorAttachments;
exports.createPrivacyIndicator = createPrivacyIndicator;
exports.addPrivacyFooter = addPrivacyFooter;
async function sendEphemeralMessage(client, options) {
    try {
        const messageOptions = {
            channel: options.channel,
            user: options.user,
            text: options.text,
            as_user: true,
        };
        if (options.thread_ts) {
            messageOptions.thread_ts = options.thread_ts;
        }
        if (options.attachments) {
            messageOptions.attachments = options.attachments;
        }
        await client.chat.postEphemeral(messageOptions);
    }
    catch (error) {
        console.error("Failed to send ephemeral message:", error);
        throw error;
    }
}
function isPrivateChannel(channelId) {
    return channelId.startsWith("G");
}
function sanitizeMessageForPrivacy(text) {
    return text
        .replace(/xoxb-[a-zA-Z0-9-]+/g, "[BOT_TOKEN]")
        .replace(/sk-[a-zA-Z0-9-]+/g, "[API_KEY]")
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[CARD_NUMBER]")
        .trim();
}
function createSuggestionAttachments(suggestions) {
    return suggestions.map((suggestion, index) => ({
        text: suggestion.content,
        color: getSuggestionColor(suggestion.type),
        actions: [
            {
                name: "use_response",
                text: "Use This Response",
                type: "button",
                value: `use_${index}`,
                style: "primary",
            },
            {
                name: "modify_response",
                text: "Modify",
                type: "button",
                value: `modify_${index}`,
            },
        ],
        footer: `Suggestion ${index + 1} of ${suggestions.length}`,
    }));
}
function getSuggestionColor(type) {
    switch (type) {
        case "template":
            return "#36a64f";
        case "improvement":
            return "#ff9500";
        case "clarifying_question":
            return "#007cba";
        case "summary":
            return "#6b4c9a";
        default:
            return "#95a5a6";
    }
}
function handleSuggestionAction(action, suggestions) {
    const match = action.match(/^(use|modify)_(\d+)$/);
    if (!match)
        return null;
    const [, actionType, indexStr] = match;
    const index = parseInt(indexStr, 10);
    if (index < 0 || index >= suggestions.length)
        return null;
    return {
        type: actionType,
        index,
        content: suggestions[index].content,
    };
}
function createModificationPrompt(originalContent) {
    return `Here's the original suggestion:\n\n"${originalContent}"\n\nPlease provide your modifications or improvements:`;
}
function createContextIndicator(userQuestion, messageCount) {
    const truncatedQuestion = userQuestion.length > 100
        ? userQuestion.substring(0, 100) + "..."
        : userQuestion;
    return `*📋 Analyzing context for:* "${truncatedQuestion}"\n*📊 Messages analyzed:* ${messageCount}`;
}
function createLoadingMessage() {
    return "*⏳ Analyzing conversation context and generating suggestions...*\n\nThis may take a few seconds.";
}
function createLoadingAttachments() {
    return [
        {
            text: "🤖 AI is thinking...",
            color: "#95a5a6",
            footer: "Please wait while I analyze the conversation",
        },
    ];
}
function createErrorMessage(error) {
    return `*❌ Error:* ${error.message}\n\nPlease try again or contact support if the problem persists.`;
}
function createErrorAttachments(error) {
    return [
        {
            text: `Error: ${error.message}`,
            color: "#e74c3c",
            footer: "Try again or contact support",
        },
    ];
}
function createPrivacyIndicator() {
    return "*🔒 This response is private and only visible to you*";
}
function addPrivacyFooter(attachments) {
    return attachments.map((attachment) => ({
        ...attachment,
        footer: attachment.footer
            ? `${attachment.footer} • Private response`
            : "Private response",
    }));
}
//# sourceMappingURL=privacyUtils.js.map