export interface PersonalityProfile {
    userId: string;
    userName: string;
    communicationStyle: string;
    emotionalTone: string;
    keyTraits: string[];
    communicationPatterns: {
        responseTime: string;
        messageLength: string;
        formality: string;
    };
    role: string;
    preferences: string[];
    recommendations: string[];
}
export interface ConversationParticipant {
    userId: string;
    userName: string;
    messageCount: number;
    messages: string[];
}
export declare class PersonalityAnalyzer {
    analyzePersonalities(participants: ConversationParticipant[]): Promise<PersonalityProfile[]>;
    private analyzeSinglePersonality;
    private buildPersonalityAnalysisPrompt;
    private parsePersonalityResponse;
}
//# sourceMappingURL=personalityAnalyzer.d.ts.map