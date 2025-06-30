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
export declare class SuggestionGenerator {
    generateSuggestions(context: SuggestionContext): Promise<Suggestion[]>;
    private buildSuggestionPrompt;
    private parseSuggestions;
    private generateFallbackSuggestions;
    getSuggestionColor(type: Suggestion["type"]): string;
}
//# sourceMappingURL=suggestionGenerator.d.ts.map