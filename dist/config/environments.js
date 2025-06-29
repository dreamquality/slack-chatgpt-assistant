"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentConfig = getEnvironmentConfig;
const developmentConfig = {
    nodeEnv: "development",
    port: 3000,
    logLevel: "debug",
    slackConfig: {
        socketMode: true,
        logLevel: "debug",
    },
    openaiConfig: {
        model: "gpt-4",
        maxTokens: 2000,
        temperature: 0.7,
    },
    rateLimit: {
        windowMs: 60000,
        maxRequests: 10,
    },
    contextAnalysis: {
        maxMessages: 100,
        maxDays: 30,
        cacheTtlMs: 300000,
    },
};
const stagingConfig = {
    nodeEnv: "staging",
    port: 3000,
    logLevel: "info",
    slackConfig: {
        socketMode: true,
        logLevel: "info",
    },
    openaiConfig: {
        model: "gpt-4",
        maxTokens: 2000,
        temperature: 0.7,
    },
    rateLimit: {
        windowMs: 60000,
        maxRequests: 5,
    },
    contextAnalysis: {
        maxMessages: 50,
        maxDays: 7,
        cacheTtlMs: 600000,
    },
};
const productionConfig = {
    nodeEnv: "production",
    port: 3000,
    logLevel: "warn",
    slackConfig: {
        socketMode: true,
        logLevel: "warn",
    },
    openaiConfig: {
        model: "gpt-4",
        maxTokens: 2000,
        temperature: 0.7,
    },
    rateLimit: {
        windowMs: 60000,
        maxRequests: 3,
    },
    contextAnalysis: {
        maxMessages: 100,
        maxDays: 30,
        cacheTtlMs: 900000,
    },
};
function getEnvironmentConfig() {
    const env = process.env.NODE_ENV || "development";
    switch (env) {
        case "production":
            return productionConfig;
        case "staging":
            return stagingConfig;
        case "development":
        default:
            return developmentConfig;
    }
}
//# sourceMappingURL=environments.js.map