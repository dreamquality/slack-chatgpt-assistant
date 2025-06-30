"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
function registerMessageEventHandler(app) {
    app.event("message", rateLimiter_1.rateLimiter, async () => {
    });
}
function setupHealthCheck(app) {
    const expressApp = app.receiver?.app;
    if (expressApp && typeof expressApp.get === "function") {
        expressApp.use((0, cookie_parser_1.default)());
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
        expressApp.get("/auth/protected", (req, res) => {
            const token = req.headers.authorization?.replace("Bearer ", "");
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: "No token provided",
                });
            }
            try {
                const { GoogleAuthService } = require("./auth/googleAuthService");
                const authService = new GoogleAuthService();
                const user = authService.verifyJWT(token);
                return res.json({
                    success: true,
                    message: "Protected route accessed successfully",
                    user: {
                        id: user.userId,
                        email: user.email,
                        name: user.name,
                    },
                });
            }
            catch (error) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid token",
                });
            }
        });
    }
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
    setupHealthCheck(app);
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