export interface Suggestion {
    type: "template" | "improvement" | "clarifying_question" | "summary";
    content: string;
    confidence: number;
}
export interface SuggestionContext {
    question: string;
    conversationHistory: string[];
    participantCount: number;
    channelType: "public" | "private" | "direct";
}
export interface SuggestionResult {
    suggestions: Suggestion[];
    isFallback: boolean;
}
export declare class SuggestionGenerator {
    generateSuggestions(context: SuggestionContext): Promise<SuggestionResult>;
    private buildSuggestionPrompt;
    private parseSuggestions;
    private generateFallbackSuggestions;
    getSuggestionColor(type: Suggestion["type"]): string;
}
//# sourceMappingURL=suggestionGenerator.d.ts.map