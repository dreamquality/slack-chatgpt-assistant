"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackConfig = void 0;
exports.createSlackApp = createSlackApp;
const bolt_1 = require("@slack/bolt");
exports.slackConfig = {
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: !!process.env.SLACK_APP_TOKEN,
    logLevel: process.env.LOG_LEVEL || bolt_1.LogLevel.INFO,
};
function createSlackApp() {
    const config = {
        token: exports.slackConfig.token,
        signingSecret: exports.slackConfig.signingSecret,
        logLevel: exports.slackConfig.logLevel,
    };
    if (exports.slackConfig.socketMode) {
        config.appToken = exports.slackConfig.appToken;
        config.socketMode = true;
    }
    return new bolt_1.App(config);
}
//# sourceMappingURL=slack.js.map