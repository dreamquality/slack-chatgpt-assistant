import { generateResponse } from "./chatgptService";

export interface Suggestion {
  type: "template" | "improvement" | "clarifying_question" | "summary";
  content: string;
  confidence?: number;
}

export async function generateSuggestions(
  context: string,
  userQuestion: string
): Promise<Suggestion[]> {
  try {
    const response = await generateResponse(context, userQuestion);

    // Parse the response and create different suggestion types
    const suggestions: Suggestion[] = [];

    // Split response into different suggestions (assuming numbered or bulleted format)
    const lines = response.content.split("\n").filter((line) => line.trim());

    lines.forEach((line, index) => {
      if (line.trim()) {
        const cleanContent = line
          .replace(/^\d+\.\s*/, "")
          .replace(/^[-*]\s*/, "")
          .trim();

        // Determine suggestion type based on content and position
        let type: Suggestion["type"] = "template";
        if (cleanContent.toLowerCase().includes("?")) {
          type = "clarifying_question";
        } else if (index === 0) {
          type = "template";
        } else if (index === 1) {
          type = "improvement";
        } else {
          type = "summary";
        }

        suggestions.push({
          type,
          content: cleanContent,
          confidence: 0.8,
        });
      }
    });

    // Ensure we have at least one of each type if possible
    const result: Suggestion[] = [];

    // Add template suggestion
    const template =
      suggestions.find((s) => s.type === "template") || suggestions[0];
    if (template) result.push(template);

    // Add improvement suggestion
    const improvement =
      suggestions.find((s) => s.type === "improvement") || suggestions[1];
    if (improvement && improvement !== template) result.push(improvement);

    // Add clarifying question
    const question =
      suggestions.find((s) => s.type === "clarifying_question") ||
      suggestions[2];
    if (question && !result.includes(question)) result.push(question);

    return result.slice(0, 3); // Limit to 3 suggestions
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [
      {
        type: "template",
        content:
          "Sorry, I encountered an error while generating suggestions. Please try again.",
        confidence: 0,
      },
    ];
  }
}

export function formatSuggestionsForSlack(suggestions: Suggestion[]): string {
  if (suggestions.length === 0) {
    return "No suggestions available.";
  }

  let formatted = "*🤖 AI Response Suggestions:*\n\n";

  suggestions.forEach((suggestion, index) => {
    const emoji = getSuggestionEmoji(suggestion.type);
    const label = getSuggestionLabel(suggestion.type);
    formatted += `${emoji} *${label}:*\n${suggestion.content}\n\n`;
  });

  return formatted.trim();
}

function getSuggestionEmoji(type: Suggestion["type"]): string {
  switch (type) {
    case "template":
      return "💬";
    case "improvement":
      return "✨";
    case "clarifying_question":
      return "❓";
    case "summary":
      return "📝";
    default:
      return "💡";
  }
}

function getSuggestionLabel(type: Suggestion["type"]): string {
  switch (type) {
    case "template":
      return "Ready Response";
    case "improvement":
      return "Enhanced Version";
    case "clarifying_question":
      return "Clarifying Question";
    case "summary":
      return "Summary";
    default:
      return "Suggestion";
  }
}

export function getFallbackSuggestions(userQuestion: string): Suggestion[] {
  return [
    {
      type: "template",
      content:
        "I'm having trouble accessing my AI capabilities right now. Here's a general response template you can customize: \"Thank you for your message. I'll look into this and get back to you shortly.\"",
      confidence: 0.3,
    },
    {
      type: "clarifying_question",
      content:
        "Could you provide more context about your question so I can give you a better response?",
      confidence: 0.5,
    },
    {
      type: "summary",
      content:
        "I'm currently experiencing technical difficulties. Please try again in a few moments, or feel free to ask your question in a different way.",
      confidence: 0.2,
    },
  ];
}
