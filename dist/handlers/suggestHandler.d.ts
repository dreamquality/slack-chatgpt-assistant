import { App } from "@slack/bolt";
export declare class SuggestHandler {
    private suggestionGenerator;
    constructor();
    handleSuggestCommand(command: any, client: any): Promise<void>;
    private extractQuestion;
    private extractConversationHistory;
    private countParticipants;
    private getChannelType;
    private formatSuggestionsForSlack;
    private getEmojiForType;
    private getTypeLabel;
}
export declare function registerSuggestHandler(app: App): void;
//# sourceMappingURL=suggestHandler.d.ts.map