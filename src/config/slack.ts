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
    port: parseInt(process.env.PORT || "3000"),
    customRoutes: [
      {
        path: "/health",
        method: ["GET"],
        handler: (_req: any, res: any) => {
          const body = JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(body);
        },
      },
      {
        path: "/status",
        method: ["GET"],
        handler: (_req: any, res: any) => {
          const body = JSON.stringify({
            status: "running",
            version: process.env.npm_package_version || "1.0.0",
            environment: process.env.NODE_ENV || "development",
            memory: process.memoryUsage(),
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(body);
        },
      },
    ],
  };
  if (slackConfig.socketMode) {
    config.appToken = slackConfig.appToken;
    config.socketMode = true;
  }
  return new App(config);
}
