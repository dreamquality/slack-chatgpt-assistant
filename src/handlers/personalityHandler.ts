import { App } from "@slack/bolt";
import { PersonalityAnalyzer } from "../services/personalityAnalyzer";
import { ProfileGenerator } from "../services/profileGenerator";
import { logger } from "../utils/logger";

export class PersonalityHandler {
  private analyzer: PersonalityAnalyzer;
  private generator: ProfileGenerator;

  constructor() {
    this.analyzer = new PersonalityAnalyzer();
    this.generator = new ProfileGenerator();
  }

  async handlePersonalityAnalysis(slackEvent: any, slackClient: any) {
    const startTime = Date.now();

    logger.info("Received personality analysis request", {
      channel: slackEvent.channel,
      user: slackEvent.user,
      action: "handle_personality_analysis",
    });

    try {
      const { channel, user } = slackEvent;

      if (!channel || !user) {
        logger.warn("Invalid request - missing channel or user", {
          channel: slackEvent.channel,
          user: slackEvent.user,
          action: "handle_personality_analysis",
        });

        await slackClient.chat.postEphemeral({
          channel,
          user,
          text: "❌ *Error*: Invalid request. Missing channel or user information.",
        });
        return;
      }

      // Get conversation history
      logger.debug("Fetching conversation history", {
        channel,
        user,
        action: "fetch_history",
      });

      const history = await slackClient.conversations.history({
        channel,
        limit: 1000, // Get last 1000 messages
      });

      if (!history.messages || history.messages.length === 0) {
        logger.warn("No conversation history found", {
          channel,
          user,
          action: "fetch_history",
        });

        await slackClient.chat.postEphemeral({
          channel,
          user,
          text: "No conversation history found to analyze.",
        });
        return;
      }

      logger.debug("Retrieved conversation history", {
        channel,
        user,
        messageCount: history.messages.length,
        action: "fetch_history",
      });

      // Extract participants and their messages
      const participants = await this.extractParticipants(
        history.messages,
        slackClient
      );

      logger.debug("Extracted participants", {
        channel,
        user,
        participantCount: participants.length,
        action: "extract_participants",
      });

      if (participants.length <= 1) {
        logger.warn("Cannot analyze personality for single participant", {
          channel,
          user,
          participantCount: participants.length,
          action: "extract_participants",
        });

        await slackClient.chat.postEphemeral({
          channel,
          user,
          text: "❌ *Error*: Cannot analyze personality for a single participant. At least 2 participants are required.",
        });
        return;
      }

      // Analyze personalities
      logger.info("Starting personality analysis", {
        channel,
        user,
        participantCount: participants.length,
        action: "analyze_personalities",
      });

      const profiles = await this.analyzer.analyzePersonalities(participants);

      if (profiles.length === 0) {
        logger.error("No personality profiles generated", {
          channel,
          user,
          participantCount: participants.length,
          action: "analyze_personalities",
        });

        await slackClient.chat.postEphemeral({
          channel,
          user,
          text: "❌ *Error*: No personality profiles could be generated. Please try again later.",
        });
        return;
      }

      logger.debug("Generated personality profiles", {
        channel,
        user,
        profileCount: profiles.length,
        action: "generate_profiles",
      });

      // Generate report
      const report = this.generator.generateReport(profiles);

      // Check if report is empty (no profiles were generated)
      if (!report.text || report.text.trim() === "") {
        logger.error("Empty report generated", {
          channel,
          user,
          participantCount: participants.length,
          action: "generate_report",
        });

        await slackClient.chat.postEphemeral({
          channel,
          user,
          text: "❌ *API Error*: Unable to analyze personalities at the moment. This could be due to:\n• API rate limit exceeded\n• Service temporarily unavailable\n• Insufficient conversation data\n\nPlease try again later or contact support if the issue persists.",
        });
        return;
      }

      logger.debug("Sending personality analysis response", {
        channel,
        user,
        profileCount: profiles.length,
        textLength: report.text.length,
        action: "send_response",
      });

      // Send response
      await slackClient.chat.postEphemeral({
        channel,
        user,
        text: report.text,
        blocks: report.blocks,
      });

      const duration = Date.now() - startTime;
      logger.info("Successfully completed personality analysis", {
        channel,
        user,
        participantCount: participants.length,
        profileCount: profiles.length,
        duration,
        action: "handle_personality_analysis",
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error in personality analysis", {
        channel: slackEvent.channel,
        user: slackEvent.user,
        error: error instanceof Error ? error.message : String(error),
        duration,
        action: "handle_personality_analysis",
      });

      await slackClient.chat.postEphemeral({
        channel: slackEvent.channel,
        user: slackEvent.user,
        text: "❌ *Error*: Failed to analyze personalities. Please try again later.",
      });
    }
  }

  private async extractParticipants(
    messages: any[],
    slackClient: any
  ): Promise<any[]> {
    const participantMap = new Map();

    for (const message of messages) {
      if (message.bot_id) continue; // Skip bot messages

      const userId = message.user;
      if (!participantMap.has(userId)) {
        // Try to get real username from Slack API
        let userName = `User ${userId}`;
        try {
          const userInfo = await slackClient.users.info({ user: userId });
          if (userInfo.user && userInfo.user.real_name) {
            userName = userInfo.user.real_name;
          } else if (userInfo.user && userInfo.user.name) {
            userName = userInfo.user.name;
          }
        } catch (error) {
          logger.warn("Failed to fetch user info", {
            userId,
            error: error instanceof Error ? error.message : String(error),
            action: "fetch_user_info",
          });
        }

        participantMap.set(userId, {
          userId,
          userName,
          messageCount: 0,
          messages: [],
        });
      }

      const participant = participantMap.get(userId);
      participant.messageCount++;
      participant.messages.push(message.text);
    }

    return Array.from(participantMap.values());
  }
}

export function registerPersonalityHandler(app: App) {
  const handler = new PersonalityHandler();

  logger.info("Registering personality analysis command", {
    command: "/personality-analyze",
    action: "register_command",
  });

  app.command("/personality-analyze", async ({ command, ack, respond }) => {
    const startTime = Date.now();

    logger.info("Received personality analysis command", {
      channel: command.channel_id,
      user: command.user_id,
      team: command.team_id,
      action: "handle_command",
    });

    await ack();

    try {
      const channelId = command.channel_id;

      // Get conversation history
      logger.debug("Fetching conversation history for command", {
        channel: channelId,
        user: command.user_id,
        action: "fetch_history",
      });

      const history = await app.client.conversations.history({
        channel: channelId,
        limit: 1000, // Get last 1000 messages
      });

      if (!history.messages || history.messages.length === 0) {
        logger.warn("No conversation history found for command", {
          channel: channelId,
          user: command.user_id,
          action: "fetch_history",
        });

        await respond({
          text: "No conversation history found to analyze.",
          response_type: "ephemeral",
        });
        return;
      }

      // Extract participants and their messages
      const participants = await handler["extractParticipants"](
        history.messages,
        app.client
      );

      logger.debug("Extracted participants for command", {
        channel: channelId,
        user: command.user_id,
        participantCount: participants.length,
        action: "extract_participants",
      });

      if (participants.length <= 1) {
        logger.warn(
          "Cannot analyze personality for single participant in command",
          {
            channel: channelId,
            user: command.user_id,
            participantCount: participants.length,
            action: "extract_participants",
          }
        );

        await respond({
          text: "Cannot analyze personality for a single participant. Need at least 2 people in the conversation.",
          response_type: "ephemeral",
        });
        return;
      }

      // Analyze personalities
      logger.info("Starting personality analysis for command", {
        channel: channelId,
        user: command.user_id,
        participantCount: participants.length,
        action: "analyze_personalities",
      });

      const profiles = await handler["analyzer"].analyzePersonalities(
        participants
      );

      logger.info("Received profiles from analyzer", {
        channel: channelId,
        user: command.user_id,
        profileCount: profiles.length,
        profiles: profiles.map((p) => ({
          userId: p.userId,
          userName: p.userName,
        })),
        action: "received_profiles",
      });

      // Check if we got any profiles
      if (profiles.length === 0) {
        logger.error("No personality profiles generated for command", {
          channel: channelId,
          user: command.user_id,
          participantCount: participants.length,
          action: "analyze_personalities",
        });

        await respond({
          text: "❌ *API Error*: Unable to analyze personalities at the moment. This could be due to:\n• API rate limit exceeded\n• Service temporarily unavailable\n• Insufficient conversation data\n\nPlease try again later or contact support if the issue persists.",
          response_type: "ephemeral",
        });
        return;
      }

      // Generate report
      const report = handler["generator"].generateReport(profiles);

      // Check if report is empty (no profiles were generated)
      if (!report.text || report.text.trim() === "") {
        logger.error("Empty report generated for command", {
          channel: channelId,
          user: command.user_id,
          participantCount: participants.length,
          action: "generate_report",
        });

        await respond({
          text: "❌ *API Error*: Unable to analyze personalities at the moment. This could be due to:\n• API rate limit exceeded\n• Service temporarily unavailable\n• Insufficient conversation data\n\nPlease try again later or contact support if the issue persists.",
          response_type: "ephemeral",
        });
        return;
      }

      logger.debug("Sending personality analysis response for command", {
        channel: channelId,
        user: command.user_id,
        profileCount: profiles.length,
        textLength: report.text.length,
        action: "send_response",
      });

      // Send response
      await respond({
        text: report.text,
        blocks: report.blocks,
        response_type: "ephemeral",
      });

      const duration = Date.now() - startTime;
      logger.info("Successfully completed personality analysis command", {
        channel: channelId,
        user: command.user_id,
        participantCount: participants.length,
        profileCount: profiles.length,
        duration,
        action: "handle_command",
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error in personality analysis command", {
        channel: command.channel_id,
        user: command.user_id,
        error: error instanceof Error ? error.message : String(error),
        duration,
        action: "handle_command",
      });

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await respond({
        text: `❌ *Error analyzing personalities:*
>${errorMessage}

Please try again later or contact support if the issue persists.`,
        response_type: "ephemeral",
      });
    }
  });
}
