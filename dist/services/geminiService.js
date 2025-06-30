"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiError = void 0;
exports.generateResponse = generateResponse;
const generative_ai_1 = require("@google/generative-ai");
class GeminiError extends Error {
    constructor(message) {
        super(message);
        this.name = "GeminiError";
    }
}
exports.GeminiError = GeminiError;
async function generateResponse(prompt, _userId) {
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (!text) {
            return {
                content: "Sorry, I could not generate a response.",
                usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                },
            };
        }
        const usageMetadata = response.usageMetadata;
        return {
            content: text,
            usage: {
                prompt_tokens: usageMetadata?.promptTokenCount || 0,
                completion_tokens: usageMetadata?.candidatesTokenCount || 0,
                total_tokens: (usageMetadata?.promptTokenCount || 0) +
                    (usageMetadata?.candidatesTokenCount || 0),
            },
        };
    }
    catch (error) {
        if (error.status === 429) {
            throw new GeminiError("Rate limit exceeded");
        }
        else if (error.status === 401) {
            throw new GeminiError("Authentication failed");
        }
        else {
            throw new GeminiError("Failed to generate response");
        }
    }
}
//# sourceMappingURL=geminiService.js.map