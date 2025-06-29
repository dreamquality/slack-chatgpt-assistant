import { App } from "@slack/bolt";

export function registerConfigHandler(app: App) {
  app.command("/assistant", async ({ command, ack, respond }) => {
    await ack();
    if (command.text.trim() === "config") {
      await respond({
        response_type: "ephemeral",
        text: "Configuration options will be available here soon! (Feature under development)",
      });
    } else {
      await respond({
        response_type: "ephemeral",
        text: "Unknown command. Try `/assistant config`.",
      });
    }
  });
}
