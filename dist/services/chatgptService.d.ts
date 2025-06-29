export interface ChatGPTResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    } | undefined;
}
export declare class ChatGPTError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare function generateResponse(context: string, userQuestion: string): Promise<ChatGPTResponse>;
//# sourceMappingURL=chatgptService.d.ts.map