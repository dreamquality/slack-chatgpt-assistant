import { ProfileGenerator } from "./profileGenerator";
import { PersonalityProfile } from "./personalityAnalyzer";

describe("ProfileGenerator", () => {
  let generator: ProfileGenerator;

  beforeEach(() => {
    generator = new ProfileGenerator();
  });

  describe("generateReport", () => {
    const mockProfiles: PersonalityProfile[] = [
      {
        userId: "U123",
        userName: "John Doe",
        communicationStyle: "direct, informal",
        emotionalTone: "positive",
        keyTraits: ["friendly", "helpful", "analytical"],
        communicationPatterns: {
          responseTime: "fast",
          messageLength: "short",
          formality: "informal",
        },
        role: "supporter",
        preferences: ["quick responses", "collaboration"],
        recommendations: ["Keep being friendly", "Ask more questions"],
      },
      {
        userId: "U456",
        userName: "Jane Smith",
        communicationStyle: "indirect, formal",
        emotionalTone: "neutral",
        keyTraits: ["professional", "detail-oriented"],
        communicationPatterns: {
          responseTime: "slow",
          messageLength: "long",
          formality: "formal",
        },
        role: "leader",
        preferences: ["thorough analysis", "documentation"],
        recommendations: ["Provide more context", "Be more direct"],
      },
    ];

    it("should generate text report correctly", () => {
      const report = generator.generateReport(mockProfiles);

      expect(report.text).toContain("🎭 *Personality Profile Analysis*");
      expect(report.text).toContain("*John Doe*");
      expect(report.text).toContain("*Jane Smith*");
      expect(report.text).toContain("Communication Style: direct, informal");
      expect(report.text).toContain("Emotional Tone: positive");
      expect(report.text).toContain(
        "Key Traits: friendly, helpful, analytical"
      );
      expect(report.text).toContain("Role: supporter");
      expect(report.text).toContain(
        "Recommendations for communicating with John Doe:"
      );
    });

    it("should generate Slack blocks correctly", () => {
      const report = generator.generateReport(mockProfiles);

      // There should be a header, divider, and 3-4 blocks per profile (name, details, key traits, recommendations, divider)
      expect(report.blocks[0]).toEqual({
        type: "header",
        text: {
          type: "plain_text",
          text: "🎭 Personality Profile Analysis",
        },
      });
      expect(report.blocks[1]).toEqual({ type: "divider" });

      // Find the name sections for each profile
      const johnNameSection = report.blocks.find(
        (block) =>
          block.type === "section" &&
          block.text?.type === "mrkdwn" &&
          block.text.text === "*John Doe*"
      );
      const janeNameSection = report.blocks.find(
        (block) =>
          block.type === "section" &&
          block.text?.type === "mrkdwn" &&
          block.text.text === "*Jane Smith*"
      );
      expect(johnNameSection).toBeDefined();
      expect(janeNameSection).toBeDefined();
    });

    it("should handle profiles without recommendations", () => {
      const profilesWithoutRecommendations = mockProfiles.map((profile) => ({
        ...profile,
        recommendations: [],
      }));

      const report = generator.generateReport(profilesWithoutRecommendations);

      expect(report.text).not.toContain(
        "Recommendations for communicating with"
      );
      // Should still have header, divider, and profile blocks
      expect(report.blocks.length).toBeGreaterThan(2);
    });

    it("should handle profiles without key traits", () => {
      const profilesWithoutTraits = mockProfiles.map((profile) => ({
        ...profile,
        keyTraits: [],
      }));

      const report = generator.generateReport(profilesWithoutTraits);

      expect(report.text).toContain("Key Traits: None identified");
      expect(report.blocks.length).toBeGreaterThan(2);
    });

    it("should handle empty profiles array", () => {
      const report = generator.generateReport([]);

      expect(report.text).toBe("🎭 *Personality Profile Analysis*\n\n");
      expect(report.blocks).toHaveLength(2); // Just header and divider
    });

    it("should escape special characters in user names", () => {
      const profilesWithSpecialChars = [
        {
          ...mockProfiles[0],
          userName: "John <Doe> & Smith",
        },
      ];

      const report = generator.generateReport(profilesWithSpecialChars);

      expect(report.text).toContain("*John <Doe> & Smith*");
      const nameSection = report.blocks.find(
        (block) =>
          block.type === "section" &&
          block.text?.type === "mrkdwn" &&
          block.text.text === "*John <Doe> & Smith*"
      );
      expect(nameSection).toBeDefined();
    });
  });
});
