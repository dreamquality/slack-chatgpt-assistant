"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiConfig = void 0;
exports.createGeminiClient = createGeminiClient;
const generative_ai_1 = require("@google/generative-ai");
exports.geminiConfig = {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    maxTokens: Number(process.env.GEMINI_MAX_TOKENS) || 2048,
    temperature: Number(process.env.GEMINI_TEMPERATURE) || 0.7,
};
function createGeminiClient() {
    if (!exports.geminiConfig.apiKey) {
        throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }
    return new generative_ai_1.GoogleGenerativeAI(exports.geminiConfig.apiKey);
}
//# sourceMappingURL=gemini.js.map