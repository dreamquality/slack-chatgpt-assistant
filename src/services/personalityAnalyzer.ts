import { generateResponse } from "./geminiService";
import { sanitizeMessageForPrivacy } from "../utils/privacyUtils";
import { logger } from "../utils/logger";

export interface PersonalityProfile {
  userId: string;
  userName: string;
  communicationStyle: string;
  emotionalTone: string;
  keyTraits: string[];
  communicationPatterns: {
    responseTime: string;
    messageLength: string;
    formality: string;
  };
  role: string;
  preferences: string[];
  recommendations: string[];
}

export interface ConversationParticipant {
  userId: string;
  userName: string;
  messageCount: number;
  messages: string[];
}

export class PersonalityAnalyzer {
  async analyzePersonalities(
    participants: ConversationParticipant[]
  ): Promise<PersonalityProfile[]> {
    logger.info("Starting personality analysis", {
      participantCount: participants.length,
      action: "analyze_personalities",
    });

    if (participants.length <= 1) {
      logger.warn("Cannot analyze personality for single participant", {
        participantCount: participants.length,
        action: "analyze_personalities",
      });
      throw new Error("Cannot analyze personality for a single participant");
    }

    const profiles: PersonalityProfile[] = [];
    const startTime = Date.now();

    for (const participant of participants) {
      try {
        logger.debug("Analyzing participant", {
          userId: participant.userId,
          userName: participant.userName,
          messageCount: participant.messageCount,
          action: "analyze_single_personality",
        });

        const profile = await this.analyzeSinglePersonality(participant);
        profiles.push(profile);

        logger.debug("Successfully analyzed participant", {
          userId: participant.userId,
          userName: participant.userName,
          action: "analyze_single_personality",
        });
      } catch (error) {
        logger.error("Failed to analyze participant", {
          userId: participant.userId,
          userName: participant.userName,
          error: error instanceof Error ? error.message : String(error),
          action: "analyze_single_personality",
        });
        // Skip this participant and continue with others
      }
    }

    const duration = Date.now() - startTime;
    logger.info("Completed personality analysis", {
      participantCount: participants.length,
      successfulProfiles: profiles.length,
      duration,
      action: "analyze_personalities",
    });

    return profiles;
  }

  private async analyzeSinglePersonality(
    participant: ConversationParticipant
  ): Promise<PersonalityProfile> {
    const startTime = Date.now();

    logger.debug("Building personality analysis prompt", {
      userId: participant.userId,
      messageCount: participant.messages.length,
      action: "build_prompt",
    });

    const prompt = this.buildPersonalityAnalysisPrompt(participant);

    logger.debug("Generating response from Gemini", {
      userId: participant.userId,
      promptLength: prompt.length,
      action: "generate_response",
    });

    const response = await generateResponse(prompt, participant.userId);

    logger.debug("Parsing personality response", {
      userId: participant.userId,
      responseLength: response.content.length,
      action: "parse_response",
    });

    const profile = this.parsePersonalityResponse(
      response.content,
      participant
    );

    const duration = Date.now() - startTime;
    logger.debug("Completed single personality analysis", {
      userId: participant.userId,
      duration,
      action: "analyze_single_personality",
    });

    return profile;
  }

  private buildPersonalityAnalysisPrompt(
    participant: ConversationParticipant
  ): string {
    // Sanitize messages for privacy before analysis
    const sanitizedMessages = participant.messages.map((msg) =>
      sanitizeMessageForPrivacy(msg)
    );

    return `Analyze the personality and communication style of a Slack user based on their messages.\n\nUser: ${
      participant.userName
    }\nMessage Count: ${
      participant.messageCount
    }\nMessages: ${sanitizedMessages.join(
      "\n"
    )}\n\nPlease provide a personality analysis in the following JSON format:\n{\n  \"communicationStyle\": \"direct/indirect, formal/informal\",\n  \"emotionalTone\": \"positive/negative/neutral\",\n  \"keyTraits\": [\"trait1\", \"trait2\", \"trait3\"],\n  \"communicationPatterns\": {\n    \"responseTime\": \"fast/slow/medium\",\n    \"messageLength\": \"short/medium/long\",\n    \"formality\": \"formal/informal/mixed\"\n  },\n  \"role\": \"leader/supporter/critic/coordinator\",\n  \"preferences\": [\"preference1\", \"preference2\"],\n  \"recommendations\": [\"recommendation1\", \"recommendation2\"]\n}\n\nFocus on communication patterns, emotional expression, and interaction style.`;
  }

  private parsePersonalityResponse(
    response: string,
    participant: ConversationParticipant
  ): PersonalityProfile {
    try {
      const parsed = JSON.parse(response);
      return {
        userId: participant.userId,
        userName: participant.userName,
        communicationStyle: parsed.communicationStyle || "unknown",
        emotionalTone: parsed.emotionalTone || "neutral",
        keyTraits: parsed.keyTraits || [],
        communicationPatterns: parsed.communicationPatterns || {
          responseTime: "unknown",
          messageLength: "unknown",
          formality: "unknown",
        },
        role: parsed.role || "participant",
        preferences: parsed.preferences || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      // Return default profile if parsing fails
      return {
        userId: participant.userId,
        userName: participant.userName,
        communicationStyle: "unknown",
        emotionalTone: "neutral",
        keyTraits: [],
        communicationPatterns: {
          responseTime: "unknown",
          messageLength: "unknown",
          formality: "unknown",
        },
        role: "participant",
        preferences: [],
        recommendations: [],
      };
    }
  }
}
