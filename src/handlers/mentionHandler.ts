import { App } from "@slack/bolt";
import { sendEphemeralMessage } from "../utils/privacyUtils";

export function registerMentionHandler(app: App) {
  app.event("app_mention", async ({ event, client }) => {
    const user = event.user;

    // Respond with an ephemeral message for privacy
    await sendEphemeralMessage(client, {
      channel: event.channel,
      user,
      text: `Hi <@${user}>, I received your mention! (Feature under development)`,
      thread_ts: event.ts,
    });
  });
}
