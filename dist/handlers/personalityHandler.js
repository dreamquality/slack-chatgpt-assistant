"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalityHandler = void 0;
exports.registerPersonalityHandler = registerPersonalityHandler;
const personalityAnalyzer_1 = require("../services/personalityAnalyzer");
const profileGenerator_1 = require("../services/profileGenerator");
const logger_1 = require("../utils/logger");
class PersonalityHandler {
    constructor() {
        this.analyzer = new personalityAnalyzer_1.PersonalityAnalyzer();
        this.generator = new profileGenerator_1.ProfileGenerator();
    }
    async handlePersonalityAnalysis(slackEvent, slackClient) {
        const startTime = Date.now();
        logger_1.logger.info("Received personality analysis request", {
            channel: slackEvent.channel,
            user: slackEvent.user,
            action: "handle_personality_analysis",
        });
        try {
            const { channel, user } = slackEvent;
            if (!channel || !user) {
                logger_1.logger.warn("Invalid request - missing channel or user", {
                    channel: slackEvent.channel,
                    user: slackEvent.user,
                    action: "handle_personality_analysis",
                });
                await slackClient.chat.postEphemeral({
                    channel,
                    user,
                    text: "❌ *Error*: Invalid request. Missing channel or user information.",
                });
                return;
            }
            logger_1.logger.debug("Fetching conversation history", {
                channel,
                user,
                action: "fetch_history",
            });
            const history = await slackClient.conversations.history({
                channel,
                limit: 1000,
            });
            if (!history.messages || history.messages.length === 0) {
                logger_1.logger.warn("No conversation history found", {
                    channel,
                    user,
                    action: "fetch_history",
                });
                await slackClient.chat.postEphemeral({
                    channel,
                    user,
                    text: "No conversation history found to analyze.",
                });
                return;
            }
            logger_1.logger.debug("Retrieved conversation history", {
                channel,
                user,
                messageCount: history.messages.length,
                action: "fetch_history",
            });
            const participants = await this.extractParticipants(history.messages, slackClient);
            logger_1.logger.debug("Extracted participants", {
                channel,
                user,
                participantCount: participants.length,
                action: "extract_participants",
            });
            if (participants.length <= 1) {
                logger_1.logger.warn("Cannot analyze personality for single participant", {
                    channel,
                    user,
                    participantCount: participants.length,
                    action: "extract_participants",
                });
                await slackClient.chat.postEphemeral({
                    channel,
                    user,
                    text: "❌ *Error*: Cannot analyze personality for a single participant. At least 2 participants are required.",
                });
                return;
            }
            logger_1.logger.info("Starting personality analysis", {
                channel,
                user,
                participantCount: participants.length,
                action: "analyze_personalities",
            });
            const profiles = await this.analyzer.analyzePersonalities(participants);
            if (profiles.length === 0) {
                logger_1.logger.error("No personality profiles generated", {
                    channel,
                    user,
                    participantCount: participants.length,
                    action: "analyze_personalities",
                });
                await slackClient.chat.postEphemeral({
                    channel,
                    user,
                    text: "❌ *Error*: No personality profiles could be generated. Please try again later.",
                });
                return;
            }
            logger_1.logger.debug("Generated personality profiles", {
                channel,
                user,
                profileCount: profiles.length,
                action: "generate_profiles",
            });
            const report = this.generator.generateReport(profiles);
            if (!report.text || report.text.trim() === "") {
                logger_1.logger.error("Empty report generated", {
                    channel,
                    user,
                    participantCount: participants.length,
                    action: "generate_report",
                });
                await slackClient.chat.postEphemeral({
                    channel,
                    user,
                    text: "❌ *API Error*: Unable to analyze personalities at the moment. This could be due to:\n• API rate limit exceeded\n• Service temporarily unavailable\n• Insufficient conversation data\n\nPlease try again later or contact support if the issue persists.",
                });
                return;
            }
            logger_1.logger.debug("Sending personality analysis response", {
                channel,
                user,
                profileCount: profiles.length,
                textLength: report.text.length,
                action: "send_response",
            });
            await slackClient.chat.postEphemeral({
                channel,
                user,
                text: report.text,
                blocks: report.blocks,
            });
            const duration = Date.now() - startTime;
            logger_1.logger.info("Successfully completed personality analysis", {
                channel,
                user,
                participantCount: participants.length,
                profileCount: profiles.length,
                duration,
                action: "handle_personality_analysis",
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error("Error in personality analysis", {
                channel: slackEvent.channel,
                user: slackEvent.user,
                error: error instanceof Error ? error.message : String(error),
                duration,
                action: "handle_personality_analysis",
            });
            await slackClient.chat.postEphemeral({
                channel: slackEvent.channel,
                user: slackEvent.user,
                text: "❌ *Error*: Failed to analyze personalities. Please try again later.",
            });
        }
    }
    async extractParticipants(messages, slackClient) {
        const participantMap = new Map();
        for (const message of messages) {
            if (message.bot_id)
                continue;
            const userId = message.user;
            if (!participantMap.has(userId)) {
                let userName = `User ${userId}`;
                try {
                    const userInfo = await slackClient.users.info({ user: userId });
                    if (userInfo.user && userInfo.user.real_name) {
                        userName = userInfo.user.real_name;
                    }
                    else if (userInfo.user && userInfo.user.name) {
                        userName = userInfo.user.name;
                    }
                }
                catch (error) {
                    logger_1.logger.warn("Failed to fetch user info", {
                        userId,
                        error: error instanceof Error ? error.message : String(error),
                        action: "fetch_user_info",
                    });
                }
                participantMap.set(userId, {
                    userId,
                    userName,
                    messageCount: 0,
                    messages: [],
                });
            }
            const participant = participantMap.get(userId);
            participant.messageCount++;
            participant.messages.push(message.text);
        }
        return Array.from(participantMap.values());
    }
}
exports.PersonalityHandler = PersonalityHandler;
function registerPersonalityHandler(app) {
    const handler = new PersonalityHandler();
    logger_1.logger.info("Registering personality analysis command", {
        command: "/personality-analyze",
        action: "register_command",
    });
    app.command("/personality-analyze", async ({ command, ack, respond }) => {
        const startTime = Date.now();
        logger_1.logger.info("Received personality analysis command", {
            channel: command.channel_id,
            user: command.user_id,
            team: command.team_id,
            action: "handle_command",
        });
        await ack();
        try {
            const channelId = command.channel_id;
            logger_1.logger.debug("Fetching conversation history for command", {
                channel: channelId,
                user: command.user_id,
                action: "fetch_history",
            });
            const history = await app.client.conversations.history({
                channel: channelId,
                limit: 1000,
            });
            if (!history.messages || history.messages.length === 0) {
                logger_1.logger.warn("No conversation history found for command", {
                    channel: channelId,
                    user: command.user_id,
                    action: "fetch_history",
                });
                await respond({
                    text: "No conversation history found to analyze.",
                    response_type: "ephemeral",
                });
                return;
            }
            const participants = await handler["extractParticipants"](history.messages, app.client);
            logger_1.logger.debug("Extracted participants for command", {
                channel: channelId,
                user: command.user_id,
                participantCount: participants.length,
                action: "extract_participants",
            });
            if (participants.length <= 1) {
                logger_1.logger.warn("Cannot analyze personality for single participant in command", {
                    channel: channelId,
                    user: command.user_id,
                    participantCount: participants.length,
                    action: "extract_participants",
                });
                await respond({
                    text: "Cannot analyze personality for a single participant. Need at least 2 people in the conversation.",
                    response_type: "ephemeral",
                });
                return;
            }
            logger_1.logger.info("Starting personality analysis for command", {
                channel: channelId,
                user: command.user_id,
                participantCount: participants.length,
                action: "analyze_personalities",
            });
            const profiles = await handler["analyzer"].analyzePersonalities(participants);
            logger_1.logger.info("Received profiles from analyzer", {
                channel: channelId,
                user: command.user_id,
                profileCount: profiles.length,
                profiles: profiles.map((p) => ({
                    userId: p.userId,
                    userName: p.userName,
                })),
                action: "received_profiles",
            });
            if (profiles.length === 0) {
                logger_1.logger.error("No personality profiles generated for command", {
                    channel: channelId,
                    user: command.user_id,
                    participantCount: participants.length,
                    action: "analyze_personalities",
                });
                await respond({
                    text: "❌ *API Error*: Unable to analyze personalities at the moment. This could be due to:\n• API rate limit exceeded\n• Service temporarily unavailable\n• Insufficient conversation data\n\nPlease try again later or contact support if the issue persists.",
                    response_type: "ephemeral",
                });
                return;
            }
            const report = handler["generator"].generateReport(profiles);
            if (!report.text || report.text.trim() === "") {
                logger_1.logger.error("Empty report generated for command", {
                    channel: channelId,
                    user: command.user_id,
                    participantCount: participants.length,
                    action: "generate_report",
                });
                await respond({
                    text: "❌ *API Error*: Unable to analyze personalities at the moment. This could be due to:\n• API rate limit exceeded\n• Service temporarily unavailable\n• Insufficient conversation data\n\nPlease try again later or contact support if the issue persists.",
                    response_type: "ephemeral",
                });
                return;
            }
            logger_1.logger.debug("Sending personality analysis response for command", {
                channel: channelId,
                user: command.user_id,
                profileCount: profiles.length,
                textLength: report.text.length,
                action: "send_response",
            });
            await respond({
                text: report.text,
                blocks: report.blocks,
                response_type: "ephemeral",
            });
            const duration = Date.now() - startTime;
            logger_1.logger.info("Successfully completed personality analysis command", {
                channel: channelId,
                user: command.user_id,
                participantCount: participants.length,
                profileCount: profiles.length,
                duration,
                action: "handle_command",
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error("Error in personality analysis command", {
                channel: command.channel_id,
                user: command.user_id,
                error: error instanceof Error ? error.message : String(error),
                duration,
                action: "handle_command",
            });
            const errorMessage = error instanceof Error ? error.message : String(error);
            await respond({
                text: `❌ *Error analyzing personalities:*
>${errorMessage}

Please try again later or contact support if the issue persists.`,
                response_type: "ephemeral",
            });
        }
    });
}
//# sourceMappingURL=personalityHandler.js.map