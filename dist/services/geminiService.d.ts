export interface GeminiResponse {
    content: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export declare class GeminiError extends Error {
    constructor(message: string);
}
export declare function generateResponse(prompt: string, _userId?: string): Promise<GeminiResponse>;
//# sourceMappingURL=geminiService.d.ts.map