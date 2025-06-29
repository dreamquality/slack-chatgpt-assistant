import { App } from "@slack/bolt";
import { configService, UserConfig } from "../services/configService";
import { sendEphemeralMessage } from "../utils/privacyUtils";

export function registerConfigHandler(app: App) {
  app.command("/assistant", async ({ command, ack, respond, client }) => {
    await ack();
    if (command.text.trim() === "config") {
      const userId = command.user_id;
      const userConfig = await configService.getUserConfig(userId);

      const configText = formatUserConfig(userConfig);
      const attachments = createConfigAttachments();

      await sendEphemeralMessage(client, {
        channel: command.channel_id,
        user: userId,
        text: configText,
        attachments,
      });
    } else {
      await respond({
        response_type: "ephemeral",
        text: "Unknown command. Try `/assistant config`.",
      });
    }
  });
}

function formatUserConfig(config: UserConfig | null): string {
  if (!config) {
    return "*⚙️ Configuration*\n\nNo custom configuration found. Using default settings.";
  }

  return `*⚙️ Your Configuration*
  
*Analysis Method:* ${config.analysisMethod}
${config.recentDays ? `*Recent Days:* ${config.recentDays}` : ""}
${config.keywords ? `*Keywords:* ${config.keywords.join(", ")}` : ""}
${config.maxMessages ? `*Max Messages:* ${config.maxMessages}` : ""}
*Last Updated:* ${new Date(config.lastUpdated).toLocaleString()}`;
}

function createConfigAttachments(): any[] {
  return [
    {
      text: "Choose your preferred analysis method:",
      color: "#36a64f",
      actions: [
        {
          name: "set_method",
          text: "Full History",
          type: "button",
          value: "full_history",
          style: "primary",
        },
        {
          name: "set_method",
          text: "Recent Messages",
          type: "button",
          value: "recent_messages",
        },
        {
          name: "set_method",
          text: "Thread Specific",
          type: "button",
          value: "thread_specific",
        },
        {
          name: "set_method",
          text: "Keyword Based",
          type: "button",
          value: "keyword_based",
        },
      ],
    },
  ];
}
