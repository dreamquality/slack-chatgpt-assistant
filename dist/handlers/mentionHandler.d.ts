import { App } from "@slack/bolt";
export declare class MentionHandler {
    private suggestionGenerator;
    constructor();
    handleMention(event: any, client: any): Promise<void>;
    private extractQuestion;
    private extractConversationHistory;
    private countParticipants;
    private getChannelType;
    private formatSuggestionsForSlack;
    private getEmojiForType;
    private getTypeLabel;
}
export declare function registerMentionHandler(app: App): void;
//# sourceMappingURL=mentionHandler.d.ts.map