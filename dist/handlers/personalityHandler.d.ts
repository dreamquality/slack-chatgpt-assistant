import { App } from "@slack/bolt";
export declare class PersonalityHandler {
    private analyzer;
    private generator;
    constructor();
    handlePersonalityAnalysis(slackEvent: any, slackClient: any): Promise<void>;
    private extractParticipants;
}
export declare function registerPersonalityHandler(app: App): void;
//# sourceMappingURL=personalityHandler.d.ts.map