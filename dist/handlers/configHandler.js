"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConfigHandler = registerConfigHandler;
const configService_1 = require("../services/configService");
const privacyUtils_1 = require("../utils/privacyUtils");
function registerConfigHandler(app) {
    app.command("/config", async ({ command, ack, client }) => {
        await ack();
        const userId = command.user_id;
        const teamId = command.team_id;
        const config = configService_1.configService.getUserConfig(userId);
        const teamConfig = configService_1.configService.getTeamConfig(teamId);
        const message = `*Your Current Configuration*

*Analysis Method:* ${config.analysisMethod}
*Recent Days:* ${config.recentDays || teamConfig.defaultRecentDays}
*Max Messages:* ${config.maxMessages || teamConfig.defaultMaxMessages}
*Keywords:* ${config.keywords?.join(", ") || teamConfig.allowedKeywords.join(", ")}

*Team Defaults:*
*Default Method:* ${teamConfig.defaultAnalysisMethod}
*Default Recent Days:* ${teamConfig.defaultRecentDays}
*Default Max Messages:* ${teamConfig.defaultMaxMessages}
*Allowed Keywords:* ${teamConfig.allowedKeywords.join(", ")}`;
        await (0, privacyUtils_1.sendEphemeralMessage)(client, {
            channel: command.channel_id,
            user: userId,
            text: message,
        });
    });
    app.command("/config-method", async ({ command, ack, client }) => {
        await ack();
        const userId = command.user_id;
        const method = command.text.trim();
        const validation = configService_1.configService.validateUserConfig({
            analysisMethod: method,
        });
        if (!validation.isValid) {
            await (0, privacyUtils_1.sendEphemeralMessage)(client, {
                channel: command.channel_id,
                user: userId,
                text: `❌ Invalid configuration: ${validation.errors.join(", ")}`,
            });
            return;
        }
        configService_1.configService.setUserConfig(userId, { analysisMethod: method });
        await (0, privacyUtils_1.sendEphemeralMessage)(client, {
            channel: command.channel_id,
            user: userId,
            text: `✅ Analysis method updated to: ${method}`,
        });
    });
    app.command("/config-reset", async ({ command, ack, client }) => {
        await ack();
        const userId = command.user_id;
        configService_1.configService.resetUserConfig(userId);
        await (0, privacyUtils_1.sendEphemeralMessage)(client, {
            channel: command.channel_id,
            user: userId,
            text: "✅ Configuration reset to defaults",
        });
    });
    app.command("/config-methods", async ({ command, ack, client }) => {
        await ack();
        const methods = configService_1.configService.getAvailableAnalysisMethods();
        const message = `*Available Analysis Methods*

${methods
            .map((method) => `*${method.label}* (${method.value})
${method.description}`)
            .join("\n\n")}`;
        await (0, privacyUtils_1.sendEphemeralMessage)(client, {
            channel: command.channel_id,
            user: command.user_id,
            text: message,
        });
    });
}
//# sourceMappingURL=configHandler.js.map