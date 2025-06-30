"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const slack_1 = require("./config/slack");
const mentionHandler_1 = require("./handlers/mentionHandler");
const suggestHandler_1 = require("./handlers/suggestHandler");
const configHandler_1 = require("./handlers/configHandler");
const personalityHandler_1 = require("./handlers/personalityHandler");
const ssoHandler_1 = require("./handlers/ssoHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./utils/logger");
const environments_1 = require("./config/environments");
function registerMessageEventHandler(app) {
    app.event("message", rateLimiter_1.rateLimiter, async () => {
    });
}
function createApp() {
    const app = (0, slack_1.createSlackApp)();
    app.event("app_mention", rateLimiter_1.rateLimiter);
    (0, mentionHandler_1.registerMentionHandler)(app);
    (0, suggestHandler_1.registerSuggestHandler)(app);
    (0, configHandler_1.registerConfigHandler)(app);
    (0, personalityHandler_1.registerPersonalityHandler)(app);
    (0, ssoHandler_1.registerSSOHandler)(app);
    registerMessageEventHandler(app);
    return app;
}
exports.app = createApp();
async function startApp() {
    const config = (0, environments_1.getEnvironmentConfig)();
    try {
        await exports.app.start(config.port);
        logger_1.logger.info(`⚡️ Slack Personality Analysis Bot is running on port ${config.port}!`, {
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
if (require.main === module) {
    startApp();
}
//# sourceMappingURL=app.js.map