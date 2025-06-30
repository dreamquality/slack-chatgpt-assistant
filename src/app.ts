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

function registerMessageEventHandler(app: App) {
  app.event("message", rateLimiter, async () => {
    // Placeholder for future message event handling (e.g., context analysis)
    // Currently, do nothing
  });
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
