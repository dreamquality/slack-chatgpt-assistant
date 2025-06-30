"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalityAnalyzer = void 0;
const geminiService_1 = require("./geminiService");
const privacyUtils_1 = require("../utils/privacyUtils");
const logger_1 = require("../utils/logger");
class PersonalityAnalyzer {
    async analyzePersonalities(participants) {
        logger_1.logger.info("Starting personality analysis", {
            participantCount: participants.length,
            action: "analyze_personalities",
        });
        if (participants.length <= 1) {
            logger_1.logger.warn("Cannot analyze personality for single participant", {
                participantCount: participants.length,
                action: "analyze_personalities",
            });
            throw new Error("Cannot analyze personality for a single participant");
        }
        const profiles = [];
        const startTime = Date.now();
        for (const participant of participants) {
            try {
                logger_1.logger.debug("Analyzing participant", {
                    userId: participant.userId,
                    userName: participant.userName,
                    messageCount: participant.messageCount,
                    action: "analyze_single_personality",
                });
                const profile = await this.analyzeSinglePersonality(participant);
                profiles.push(profile);
                logger_1.logger.debug("Successfully analyzed participant", {
                    userId: participant.userId,
                    userName: participant.userName,
                    action: "analyze_single_personality",
                });
            }
            catch (error) {
                logger_1.logger.error("Failed to analyze participant", {
                    userId: participant.userId,
                    userName: participant.userName,
                    error: error instanceof Error ? error.message : String(error),
                    action: "analyze_single_personality",
                });
            }
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info("Completed personality analysis", {
            participantCount: participants.length,
            successfulProfiles: profiles.length,
            duration,
            action: "analyze_personalities",
        });
        return profiles;
    }
    async analyzeSinglePersonality(participant) {
        const startTime = Date.now();
        logger_1.logger.debug("Building personality analysis prompt", {
            userId: participant.userId,
            messageCount: participant.messages.length,
            action: "build_prompt",
        });
        const prompt = this.buildPersonalityAnalysisPrompt(participant);
        logger_1.logger.debug("Generating response from Gemini", {
            userId: participant.userId,
            promptLength: prompt.length,
            action: "generate_response",
        });
        const response = await (0, geminiService_1.generateResponse)(prompt, participant.userId);
        logger_1.logger.debug("Parsing personality response", {
            userId: participant.userId,
            responseLength: response.content.length,
            action: "parse_response",
        });
        const profile = this.parsePersonalityResponse(response.content, participant);
        const duration = Date.now() - startTime;
        logger_1.logger.debug("Completed single personality analysis", {
            userId: participant.userId,
            duration,
            action: "analyze_single_personality",
        });
        return profile;
    }
    buildPersonalityAnalysisPrompt(participant) {
        const sanitizedMessages = participant.messages.map((msg) => (0, privacyUtils_1.sanitizeMessageForPrivacy)(msg));
        return `Analyze the personality and communication style of a Slack user based on their messages.\n\nUser: ${participant.userName}\nMessage Count: ${participant.messageCount}\nMessages: ${sanitizedMessages.join("\n")}\n\nPlease provide a personality analysis in the following JSON format:\n{\n  \"communicationStyle\": \"direct/indirect, formal/informal\",\n  \"emotionalTone\": \"positive/negative/neutral\",\n  \"keyTraits\": [\"trait1\", \"trait2\", \"trait3\"],\n  \"communicationPatterns\": {\n    \"responseTime\": \"fast/slow/medium\",\n    \"messageLength\": \"short/medium/long\",\n    \"formality\": \"formal/informal/mixed\"\n  },\n  \"role\": \"leader/supporter/critic/coordinator\",\n  \"preferences\": [\"preference1\", \"preference2\"],\n  \"recommendations\": [\"recommendation1\", \"recommendation2\"]\n}\n\nFocus on communication patterns, emotional expression, and interaction style.`;
    }
    parsePersonalityResponse(response, participant) {
        try {
            const parsed = JSON.parse(response);
            return {
                userId: participant.userId,
                userName: participant.userName,
                communicationStyle: parsed.communicationStyle || "unknown",
                emotionalTone: parsed.emotionalTone || "neutral",
                keyTraits: parsed.keyTraits || [],
                communicationPatterns: parsed.communicationPatterns || {
                    responseTime: "unknown",
                    messageLength: "unknown",
                    formality: "unknown",
                },
                role: parsed.role || "participant",
                preferences: parsed.preferences || [],
                recommendations: parsed.recommendations || [],
            };
        }
        catch (error) {
            return {
                userId: participant.userId,
                userName: participant.userName,
                communicationStyle: "unknown",
                emotionalTone: "neutral",
                keyTraits: [],
                communicationPatterns: {
                    responseTime: "unknown",
                    messageLength: "unknown",
                    formality: "unknown",
                },
                role: "participant",
                preferences: [],
                recommendations: [],
            };
        }
    }
}
exports.PersonalityAnalyzer = PersonalityAnalyzer;
//# sourceMappingURL=personalityAnalyzer.js.map