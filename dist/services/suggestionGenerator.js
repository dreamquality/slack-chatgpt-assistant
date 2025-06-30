"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionGenerator = void 0;
const geminiService_1 = require("./geminiService");
const logger_1 = require("../utils/logger");
class SuggestionGenerator {
    async generateSuggestions(context) {
        const startTime = Date.now();
        logger_1.logger.info("Generating response suggestions", {
            questionLength: context.question.length,
            historyLength: context.conversationHistory.length,
            participantCount: context.participantCount,
            channelType: context.channelType,
            action: "generate_suggestions",
        });
        try {
            const prompt = this.buildSuggestionPrompt(context);
            logger_1.logger.debug("Built suggestion prompt", {
                promptLength: prompt.length,
                action: "build_prompt",
            });
            const response = await (0, geminiService_1.generateResponse)(prompt, "suggestion_generator");
            logger_1.logger.debug("Received Gemini response", {
                responseLength: response.content.length,
                action: "generate_response",
            });
            const suggestions = this.parseSuggestions(response.content);
            const duration = Date.now() - startTime;
            logger_1.logger.info("Successfully generated suggestions", {
                suggestionCount: suggestions.length,
                duration,
                action: "generate_suggestions",
            });
            return {
                suggestions,
                isFallback: false,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error("Failed to generate suggestions", {
                error: error instanceof Error ? error.message : String(error),
                duration,
                action: "generate_suggestions",
            });
            const fallbackSuggestions = this.generateFallbackSuggestions(context.question);
            return {
                suggestions: fallbackSuggestions,
                isFallback: true,
            };
        }
    }
    buildSuggestionPrompt(context) {
        const { question, conversationHistory, participantCount, channelType } = context;
        const historyText = conversationHistory
            .slice(-10)
            .join("\n");
        return `You are a helpful assistant that provides response suggestions for Slack conversations. Analyze the context and provide 3-4 different types of response suggestions.

Context:
- Question/Request: "${question}"
- Channel Type: ${channelType}
- Participants: ${participantCount} people
- Recent Conversation History:
${historyText}

Please provide response suggestions in the following JSON format:
[
  {
    "type": "template",
    "content": "A ready-to-use response template",
    "confidence": 0.9
  },
  {
    "type": "improvement", 
    "content": "A suggestion to improve or clarify the response",
    "confidence": 0.8
  },
  {
    "type": "clarifying_question",
    "content": "A question to gather more information",
    "confidence": 0.7
  },
  {
    "type": "summary",
    "content": "A summary of key points to address",
    "confidence": 0.8
  }
]

Guidelines:
- Keep responses concise and professional
- Consider the channel type and participant count
- Provide actionable and helpful suggestions
- Confidence should be between 0.1 and 1.0
- Focus on being helpful and constructive`;
    }
    parseSuggestions(response) {
        const validTypes = [
            "template",
            "improvement",
            "clarifying_question",
            "summary",
        ];
        try {
            let jsonContent = response.trim();
            if (jsonContent.startsWith("```")) {
                jsonContent = jsonContent.replace(/```json|```/gi, "").trim();
            }
            const firstBracket = jsonContent.indexOf("[");
            if (firstBracket !== -1) {
                let bracketCount = 0;
                let endBracket = -1;
                for (let i = firstBracket; i < jsonContent.length; i++) {
                    if (jsonContent[i] === "[") {
                        bracketCount++;
                    }
                    else if (jsonContent[i] === "]") {
                        bracketCount--;
                        if (bracketCount === 0) {
                            endBracket = i;
                            break;
                        }
                    }
                }
                if (endBracket !== -1) {
                    jsonContent = jsonContent.substring(firstBracket, endBracket + 1);
                }
            }
            jsonContent = jsonContent.replace(/\*\*[^*]+\*\*/g, "");
            jsonContent = jsonContent.replace(/\*[^*]+\*/g, "");
            jsonContent = jsonContent.replace(/^[^\[]*/, "");
            jsonContent = jsonContent.replace(/\][^\]]*$/, "]");
            jsonContent = jsonContent.replace(/^#+\s*.*$/gm, "");
            jsonContent = jsonContent.replace(/^\*\*.*\*\*$/gm, "");
            jsonContent = jsonContent.replace(/^\*.*\*$/gm, "");
            jsonContent = jsonContent
                .replace(/\n+/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            const parsed = JSON.parse(jsonContent);
            if (!Array.isArray(parsed)) {
                throw new Error("Response is not an array");
            }
            return parsed
                .filter((item) => validTypes.includes(item.type) &&
                item.content &&
                typeof item.confidence === "number" &&
                item.confidence >= 0.1 &&
                item.confidence <= 1.0)
                .map((item) => ({
                type: item.type,
                content: item.content,
                confidence: item.confidence,
            }))
                .slice(0, 4);
        }
        catch (error) {
            logger_1.logger.error("Failed to parse suggestions", {
                error: error instanceof Error ? error.message : String(error),
                response: response.substring(0, 200) + "...",
                action: "parse_suggestions",
            });
            throw new Error("Failed to parse suggestions from AI response");
        }
    }
    generateFallbackSuggestions(question) {
        logger_1.logger.warn("Using fallback suggestions", {
            question: question.substring(0, 100),
            action: "fallback_suggestions",
        });
        return [
            {
                type: "template",
                content: `I understand you're asking about "${question}". Let me help you with that.`,
                confidence: 0.7,
            },
            {
                type: "clarifying_question",
                content: "Could you provide more context about what you need help with?",
                confidence: 0.6,
            },
            {
                type: "summary",
                content: "I'm here to help! Let me know if you need any clarification.",
                confidence: 0.5,
            },
        ];
    }
    getSuggestionColor(type) {
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
}
exports.SuggestionGenerator = SuggestionGenerator;
//# sourceMappingURL=suggestionGenerator.js.map