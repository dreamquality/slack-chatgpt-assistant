import { WebClient } from "@slack/web-api";
export interface EphemeralMessageOptions {
    channel: string;
    user: string;
    text: string;
    thread_ts?: string;
    attachments?: any[];
}
export declare function sendEphemeralMessage(client: WebClient, options: EphemeralMessageOptions): Promise<void>;
export declare function isPrivateChannel(channelId: string): boolean;
export declare function sanitizeMessageForPrivacy(text: string): string;
export declare function createSuggestionAttachments(suggestions: any[]): any[];
export declare function handleSuggestionAction(action: string, suggestions: any[]): {
    type: "use" | "modify";
    index: number;
    content: string;
} | null;
export declare function createModificationPrompt(originalContent: string): string;
export declare function createContextIndicator(userQuestion: string, messageCount: number): string;
export declare function createLoadingMessage(): string;
export declare function createLoadingAttachments(): any[];
export declare function createErrorMessage(error: Error): string;
export declare function createErrorAttachments(error: Error): any[];
export declare function createPrivacyIndicator(): string;
export declare function addPrivacyFooter(attachments: any[]): any[];
//# sourceMappingURL=privacyUtils.d.ts.map