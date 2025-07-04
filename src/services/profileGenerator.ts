import { PersonalityProfile } from "./personalityAnalyzer";

export interface ProfileReport {
  text: string;
  blocks: any[];
}

export class ProfileGenerator {
  generateReport(profiles: PersonalityProfile[]): ProfileReport {
    // Return empty report if no profiles
    if (profiles.length === 0) {
      return {
        text: "",
        blocks: [],
      };
    }

    let text = "🎭 *Personality Profile Analysis*\n\n";
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎭 Personality Profile Analysis",
        },
      },
      {
        type: "divider",
      },
    ];

    for (const profile of profiles) {
      // Add profile section to text
      text += `*${profile.userName}*\n`;
      text += `Communication Style: ${profile.communicationStyle}\n`;
      text += `Emotional Tone: ${profile.emotionalTone}\n`;
      text += `Key Traits: ${
        profile.keyTraits.join(", ") || "None identified"
      }\n`;
      text += `Role: ${profile.role}\n`;
      text += `Response Time: ${profile.communicationPatterns.responseTime}\n`;
      text += `Message Length: ${profile.communicationPatterns.messageLength}\n`;
      text += `Formality: ${profile.communicationPatterns.formality}\n`;

      if (profile.preferences && profile.preferences.length > 0) {
        text += `Preferences: ${profile.preferences.join(", ")}\n`;
      }

      if (profile.recommendations && profile.recommendations.length > 0) {
        text += `\nRecommendations for communicating with ${profile.userName}:\n`;
        profile.recommendations.forEach((rec, index) => {
          text += `${index + 1}. ${rec}\n`;
        });
      }

      text += "\n";

      // Add profile section to blocks
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${profile.userName}*`,
        },
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Communication Style: ${
            profile.communicationStyle
          }\nEmotional Tone: ${profile.emotionalTone}\nKey Traits: ${
            profile.keyTraits.join(", ") || "None identified"
          }\nRole: ${profile.role}`,
        },
      });

      if (profile.keyTraits && profile.keyTraits.length > 0) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Key Traits:* ${profile.keyTraits.join(", ")}`,
          },
        });
      }

      if (profile.recommendations && profile.recommendations.length > 0) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Recommendations for communicating with ${
              profile.userName
            }:*\n${profile.recommendations
              .map((rec, index) => `${index + 1}. ${rec}`)
              .join("\n")}`,
          },
        });
      }

      blocks.push({
        type: "divider",
      });
    }

    return { text, blocks };
  }
}
