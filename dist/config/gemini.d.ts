import { GoogleGenerativeAI } from "@google/generative-ai";
export declare const geminiConfig: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
};
export declare function createGeminiClient(): GoogleGenerativeAI;
//# sourceMappingURL=gemini.d.ts.map