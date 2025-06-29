export interface Suggestion {
    type: "assertive" | "clarifying" | "collaborative" | "professional";
    text: string;
    confidence: number;
}
export interface SuggestionResponse {
    suggestions: Suggestion[];
    contextSummary: string;
    analysisMethod: string;
}
export declare function generateSuggestions(context: string, userQuestion: string, analysisMethod?: string): Promise<SuggestionResponse>;
export declare function formatSuggestionsForSlack(suggestions: Suggestion[]): string;
export declare function getFallbackSuggestions(): Suggestion[];
//# sourceMappingURL=suggestionGenerator.d.ts.map