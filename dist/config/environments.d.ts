export interface EnvironmentConfig {
    nodeEnv: string;
    port: number;
    logLevel: string;
    slackConfig: {
        socketMode: boolean;
        logLevel: string;
    };
    openaiConfig: {
        model: string;
        maxTokens: number;
        temperature: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    contextAnalysis: {
        maxMessages: number;
        maxDays: number;
        cacheTtlMs: number;
    };
}
export declare function getEnvironmentConfig(): EnvironmentConfig;
//# sourceMappingURL=environments.d.ts.map