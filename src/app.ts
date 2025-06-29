import { createSlackApp } from "./config/slack";
import { registerMentionHandler } from "./handlers/mentionHandler";
import { registerConfigHandler } from "./handlers/configHandler";
import { App } from "@slack/bolt";
import { rateLimiter } from "./middleware/rateLimiter";

function registerMessageEventHandler(app: App) {
  app.event("message", rateLimiter, async ({ event, context }) => {
    // Placeholder for future message event handling (e.g., context analysis)
    // Currently, do nothing
  });
}

async function startApp() {
  const app = createSlackApp();

  // Register event handlers
  app.event("app_mention", rateLimiter);
  registerMentionHandler(app);
  registerConfigHandler(app);
  registerMessageEventHandler(app);

  try {
    await app.start(process.env.PORT ? Number(process.env.PORT) : 3000);
    console.log("⚡️ Slack ChatGPT Assistant Bot is running!");
  } catch (error) {
    console.error("Failed to start Slack app:", error);
    process.exit(1);
  }
}

startApp();
