import { createSlackApp } from "./config/slack";
import { registerMentionHandler } from "./handlers/mentionHandler";
import { registerConfigHandler } from "./handlers/configHandler";
import { App } from "@slack/bolt";
import { rateLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";
import { getEnvironmentConfig } from "./config/environments";
import { Request, Response } from "express";

function registerMessageEventHandler(app: App) {
  app.event("message", rateLimiter, async () => {
    // Placeholder for future message event handling (e.g., context analysis)
    // Currently, do nothing
  });
}

function setupHealthCheck(app: App) {
  // Add a simple health check endpoint using Express
  const expressApp = (app as any).receiver?.app;
  if (expressApp) {
    expressApp.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    expressApp.get("/status", (req: Request, res: Response) => {
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
  const config = getEnvironmentConfig();
  const app = createSlackApp();

  // Register event handlers
  app.event("app_mention", rateLimiter);
  registerMentionHandler(app);
  registerConfigHandler(app);
  registerMessageEventHandler(app);

  // Setup health checks
  setupHealthCheck(app);

  try {
    await app.start(config.port);
    logger.info(
      `⚡️ Slack ChatGPT Assistant Bot is running on port ${config.port}!`,
      {
        environment: config.nodeEnv,
        port: config.port,
      }
    );
  } catch (error) {
    logger.error("Failed to start Slack app", {
      error: (error as Error).message,
    });
    process.exit(1);
  }
}

startApp();
