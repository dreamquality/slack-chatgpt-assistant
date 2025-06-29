export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export interface LogContext {
    userId?: string;
    channelId?: string;
    action?: string;
    duration?: number;
    [key: string]: any;
}
declare class Logger {
    private level;
    constructor();
    private getLogLevel;
    private formatMessage;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    time(label: string): void;
    timeEnd(label: string): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map