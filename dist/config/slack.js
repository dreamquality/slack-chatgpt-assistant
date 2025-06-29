"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackConfig = void 0;
exports.createSlackApp = createSlackApp;
const bolt_1 = require("@slack/bolt");
exports.slackConfig = {
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    logLevel: process.env.LOG_LEVEL || bolt_1.LogLevel.INFO,
};
function createSlackApp() {
    return new bolt_1.App({
        token: exports.slackConfig.token,
        signingSecret: exports.slackConfig.signingSecret,
        appToken: exports.slackConfig.appToken,
        socketMode: exports.slackConfig.socketMode,
        logLevel: exports.slackConfig.logLevel,
    });
}
//# sourceMappingURL=slack.js.map