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

    // If no profiles were generated, throw an error
    if (profiles.length === 0) {
      logger.error("No personality profiles could be generated", {
        participantCount: participants.length,
        duration,
        action: "analyze_personalities",
      });
      throw new Error(
        "Failed to analyze any participants. All API calls failed."
      );
    }

    return profiles;
  }

  private async analyzeSinglePersonality(
    participant: ConversationParticipant
  ): Promise<PersonalityProfile> {
    const startTime = Date.now();

    logger.info("Building personality analysis prompt", {
      userId: participant.userId,
      messageCount: participant.messages.length,
      action: "build_prompt",
    });

    const prompt = this.buildPersonalityAnalysisPrompt(participant);

    logger.info("Generating response from Gemini", {
      userId: participant.userId,
      promptLength: prompt.length,
      action: "generate_response",
    });

    const response = await generateResponse(prompt, participant.userId);

    logger.info("Raw Gemini response", {
      userId: participant.userId,
      response: response.content,
      action: "raw_gemini_response",
    });

    const profile = this.parsePersonalityResponse(
      response.content,
      participant
    );

    logger.info("Parsed personality profile", {
      userId: participant.userId,
      profile,
      action: "parsed_personality_profile",
    });

    const duration = Date.now() - startTime;
    logger.info("Completed single personality analysis", {
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
      // Handle markdown-wrapped JSON responses from Gemini
      let jsonContent = response.trim();

      // Remove all code block markers and 'json' language hints
      if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/```json|```/gi, "").trim();
      }

      // Find the first complete JSON object by looking for matching braces
      const firstBrace = jsonContent.indexOf("{");
      if (firstBrace !== -1) {
        let braceCount = 0;
        let endBrace = -1;

        for (let i = firstBrace; i < jsonContent.length; i++) {
          if (jsonContent[i] === "{") {
            braceCount++;
          } else if (jsonContent[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              endBrace = i;
              break;
            }
          }
        }

        if (endBrace !== -1) {
          jsonContent = jsonContent.substring(firstBrace, endBrace + 1);
        }
      }

      // Additional cleanup: remove any markdown formatting that might remain
      jsonContent = jsonContent.replace(/\*\*[^*]+\*\*/g, ""); // Remove **bold** text
      jsonContent = jsonContent.replace(/\*[^*]+\*/g, ""); // Remove *italic* text
      jsonContent = jsonContent.replace(/^[^{]*/, ""); // Remove anything before first {
      jsonContent = jsonContent.replace(/}[^}]*$/, "}"); // Remove anything after last }

      // Remove any remaining markdown headers or formatting
      jsonContent = jsonContent.replace(/^#+\s*.*$/gm, ""); // Remove markdown headers
      jsonContent = jsonContent.replace(/^\*\*.*\*\*$/gm, ""); // Remove bold lines
      jsonContent = jsonContent.replace(/^\*.*\*$/gm, ""); // Remove italic lines

      // Clean up any extra whitespace and newlines
      jsonContent = jsonContent
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      logger.info("Extracted JSON content", {
        userId: participant.userId,
        jsonContent,
        action: "extract_json",
      });

      const parsed = JSON.parse(jsonContent);
      logger.info("Parsed Gemini JSON", {
        userId: participant.userId,
        parsed,
        action: "parsed_gemini_json",
      });
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
      logger.error(
        "Failed to parse personality response, using default values",
        {
          userId: participant.userId,
          userName: participant.userName,
          error: error instanceof Error ? error.message : String(error),
          response: response.substring(0, 200) + "...",
          action: "parse_personality_response",
        }
      );

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
