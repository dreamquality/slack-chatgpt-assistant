export interface ErrorContext {
    userId?: string;
    channelId?: string;
    action?: string;
    timestamp: number;
}
export declare class BotError extends Error {
    code: string;
    context?: ErrorContext | undefined;
    originalError?: Error | undefined;
    constructor(message: string, code: string, context?: ErrorContext | undefined, originalError?: Error | undefined);
}
export declare function handleSlackError(error: any, context?: ErrorContext): BotError;
export declare function handleOpenAIError(error: any, context?: ErrorContext): BotError;
export declare function handleConfigError(error: any, context?: ErrorContext): BotError;
export declare function logError(error: BotError): void;
//# sourceMappingURL=errorHandler.d.ts.map