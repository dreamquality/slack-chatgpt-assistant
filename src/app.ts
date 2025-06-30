import { createSlackApp } from "./config/slack";
import { registerMentionHandler } from "./handlers/mentionHandler";
import { registerSuggestHandler } from "./handlers/suggestHandler";
import { registerConfigHandler } from "./handlers/configHandler";
import { registerPersonalityHandler } from "./handlers/personalityHandler";
import { registerSSOHandler } from "./handlers/ssoHandler";
import { App } from "@slack/bolt";
import { rateLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";
import { getEnvironmentConfig } from "./config/environments";
import { Request, Response } from "express";
import cookieParser from "cookie-parser";

function registerMessageEventHandler(app: App) {
  app.event("message", rateLimiter, async () => {
    // Placeholder for future message event handling (e.g., context analysis)
    // Currently, do nothing
  });
}

function setupHealthCheck(app: App) {
  // Add a simple health check endpoint using Express
  const expressApp = (app as any).receiver?.app;
  if (expressApp && typeof expressApp.get === "function") {
    // Add cookie parser middleware
    expressApp.use(cookieParser());

    expressApp.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    expressApp.get("/status", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "running",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        memory: process.memoryUsage(),
      });
    });

    // Add protected route for testing authentication
    expressApp.get("/auth/protected", (req: Request, res: Response) => {
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
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: "Invalid token",
        });
      }
    });
  }
}

export function createApp(): App {
  const app = createSlackApp();

  // Register event handlers
  app.event("app_mention", rateLimiter);
  registerMentionHandler(app);
  registerSuggestHandler(app);
  registerConfigHandler(app);
  registerPersonalityHandler(app);
  registerSSOHandler(app);
  registerMessageEventHandler(app);

  // Setup health checks
  setupHealthCheck(app);

  return app;
}

export const app = createApp();

async function startApp() {
  const config = getEnvironmentConfig();

  try {
    await app.start(config.port);
    logger.info(
      `⚡️ Slack Personality Analysis Bot is running on port ${config.port}!`,
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

// Only start the app if this file is run directly
if (require.main === module) {
  startApp();
}
