import { App } from "@slack/bolt";
import { configService } from "../services/configService";
import { sendEphemeralMessage } from "../utils/privacyUtils";

export function registerConfigHandler(app: App) {
  // Command to show current configuration
  app.command("/config", async ({ command, ack, client }) => {
    await ack();

    const userId = command.user_id;
    const teamId = command.team_id;
    const config = configService.getUserConfig(userId);
    const teamConfig = configService.getTeamConfig(teamId);

    const message = `*Your Current Configuration*

*Analysis Method:* ${config.analysisMethod}
*Recent Days:* ${config.recentDays || teamConfig.defaultRecentDays}
*Max Messages:* ${config.maxMessages || teamConfig.defaultMaxMessages}
*Keywords:* ${
      config.keywords?.join(", ") || teamConfig.allowedKeywords.join(", ")
    }

*Team Defaults:*
*Default Method:* ${teamConfig.defaultAnalysisMethod}
*Default Recent Days:* ${teamConfig.defaultRecentDays}
*Default Max Messages:* ${teamConfig.defaultMaxMessages}
*Allowed Keywords:* ${teamConfig.allowedKeywords.join(", ")}`;

    await sendEphemeralMessage(client, {
      channel: command.channel_id,
      user: userId,
      text: message,
    });
  });

  // Command to change analysis method
  app.command("/config-method", async ({ command, ack, client }) => {
    await ack();

    const userId = command.user_id;
    const method = command.text.trim() as any;

    const validation = configService.validateUserConfig({
      analysisMethod: method,
    });

    if (!validation.isValid) {
      await sendEphemeralMessage(client, {
        channel: command.channel_id,
        user: userId,
        text: `❌ Invalid configuration: ${validation.errors.join(", ")}`,
      });
      return;
    }

    configService.setUserConfig(userId, { analysisMethod: method });

    await sendEphemeralMessage(client, {
      channel: command.channel_id,
      user: userId,
      text: `✅ Analysis method updated to: ${method}`,
    });
  });

  // Command to reset configuration
  app.command("/config-reset", async ({ command, ack, client }) => {
    await ack();

    const userId = command.user_id;
    configService.resetUserConfig(userId);

    await sendEphemeralMessage(client, {
      channel: command.channel_id,
      user: userId,
      text: "✅ Configuration reset to defaults",
    });
  });

  // Command to show available methods
  app.command("/config-methods", async ({ command, ack, client }) => {
    await ack();

    const methods = configService.getAvailableAnalysisMethods();
    const message = `*Available Analysis Methods*

${methods
  .map(
    (method) => `*${method.label}* (${method.value})
${method.description}`
  )
  .join("\n\n")}`;

    await sendEphemeralMessage(client, {
      channel: command.channel_id,
      user: command.user_id,
      text: message,
    });
  });
}
