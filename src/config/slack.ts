import { App, LogLevel } from "@slack/bolt";

export const slackConfig = {
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  appToken: process.env.SLACK_APP_TOKEN!,
  socketMode: !!process.env.SLACK_APP_TOKEN,
  logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
};

export function createSlackApp() {
  const config: any = {
    token: slackConfig.token,
    signingSecret: slackConfig.signingSecret,
    logLevel: slackConfig.logLevel,
  };
  if (slackConfig.socketMode) {
    config.appToken = slackConfig.appToken;
    config.socketMode = true;
  }
  return new App(config);
}
