"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const slack_1 = require("./config/slack");
const mentionHandler_1 = require("./handlers/mentionHandler");
const configHandler_1 = require("./handlers/configHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./utils/logger");
const environments_1 = require("./config/environments");
function registerMessageEventHandler(app) {
    app.event("message", rateLimiter_1.rateLimiter, async () => {
    });
}
function setupHealthCheck(app) {
    const expressApp = app.receiver?.app;
    if (expressApp) {
        expressApp.get("/health", (_req, res) => {
            res.status(200).json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || "development",
            });
        });
        expressApp.get("/status", (_req, res) => {
            res.status(200).json({
                status: "running",
                version: process.env.npm_package_version || "1.0.0",
                environment: process.env.NODE_ENV || "development",
                memory: process.memoryUsage(),
            });
        });
    }
}
async function startApp() {
    const config = (0, environments_1.getEnvironmentConfig)();
    const app = (0, slack_1.createSlackApp)();
    app.event("app_mention", rateLimiter_1.rateLimiter);
    (0, mentionHandler_1.registerMentionHandler)(app);
    (0, configHandler_1.registerConfigHandler)(app);
    registerMessageEventHandler(app);
    setupHealthCheck(app);
    try {
        await app.start(config.port);
        logger_1.logger.info(`⚡️ Slack ChatGPT Assistant Bot is running on port ${config.port}!`, {
            environment: config.nodeEnv,
            port: config.port,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to start Slack app", {
            error: error.message,
        });
        process.exit(1);
    }
}
startApp();
//# sourceMappingURL=app.js.map