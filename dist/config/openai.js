"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiConfig = void 0;
exports.createOpenAIClient = createOpenAIClient;
const openai_1 = __importDefault(require("openai"));
exports.openaiConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4",
    maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 2000,
    temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
};
function createOpenAIClient() {
    if (!exports.openaiConfig.apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required");
    }
    return new openai_1.default({
        apiKey: exports.openaiConfig.apiKey,
    });
}
//# sourceMappingURL=openai.js.map