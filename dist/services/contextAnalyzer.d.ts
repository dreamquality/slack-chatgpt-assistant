import { WebClient } from "@slack/web-api";
export interface ConversationHistoryOptions {
    channel: string;
    latest?: string;
    oldest?: string;
    limit?: number;
    thread_ts?: string;
}
export declare function fetchConversationHistory(client: WebClient, options: ConversationHistoryOptions): Promise<import("@slack/web-api/dist/types/response/ConversationsRepliesResponse").MessageElement[] | import("@slack/web-api/dist/types/response/ConversationsHistoryResponse").MessageElement[]>;
export declare function fetchMonthHistory(client: WebClient, channel: string, thread_ts?: string, maxDays?: number, maxMessages?: number): Promise<any[]>;
export interface ProcessedMessage {
    user: string;
    text: string;
    ts: string;
    reactions: string[];
    thread_ts?: string;
}
export declare function extractTextAndReactions(messages: any[]): ProcessedMessage[];
export declare function filterAndCleanMessages(messages: any[]): ProcessedMessage[];
export declare function summarizeContext(messages: ProcessedMessage[], maxTokens?: number): string;
export declare function analyzeFullHistory(messages: ProcessedMessage[]): ProcessedMessage[];
export declare function analyzeRecentMessages(messages: ProcessedMessage[], days?: number): ProcessedMessage[];
export declare function analyzeThread(messages: ProcessedMessage[], thread_ts: string): ProcessedMessage[];
export declare function filterByKeywords(messages: ProcessedMessage[], keywords: string[]): ProcessedMessage[];
export declare function getCachedContext(key: string): ProcessedMessage[] | undefined;
export declare function setCachedContext(key: string, data: ProcessedMessage[]): void;
//# sourceMappingURL=contextAnalyzer.d.ts.map