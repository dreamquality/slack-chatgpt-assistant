import { App, LogLevel } from "@slack/bolt";

export const slackConfig = {
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  appToken: process.env.SLACK_APP_TOKEN!,
  socketMode: true,
  logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
};

export function createSlackApp() {
  return new App({
    token: slackConfig.token,
    signingSecret: slackConfig.signingSecret,
    appToken: slackConfig.appToken,
    socketMode: slackConfig.socketMode,
    logLevel: slackConfig.logLevel,
  });
}
