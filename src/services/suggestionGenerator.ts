import { generateResponse } from "./chatgptService";

export interface Suggestion {
  type: "assertive" | "clarifying" | "collaborative" | "professional";
  text: string;
  confidence: number;
}

export interface SuggestionResponse {
  suggestions: Suggestion[];
  contextSummary: string;
  analysisMethod: string;
}

export async function generateSuggestions(
  context: string,
  userQuestion: string,
  analysisMethod: string = "recent_messages"
): Promise<SuggestionResponse> {
  try {
    const prompt = `Based on the conversation context below, provide 3 different types of response suggestions for the user's question. Each suggestion should be appropriate for the context and tone of the conversation.

CONVERSATION CONTEXT:
${context}

USER'S QUESTION: ${userQuestion}

ANALYSIS METHOD USED: ${analysisMethod}

Please provide 3 suggestions in the following format:

1. ASSERTIVE RESPONSE (direct, confident, takes charge):
[Your assertive response here]

2. CLARIFYING QUESTION (asks for more information):
[Your clarifying question here]

3. COLLABORATIVE APPROACH (works with others, inclusive):
[Your collaborative response here]

Make sure each suggestion is:
- Contextually relevant to the conversation
- Professional and appropriate
- Different in tone and approach
- Actionable and specific`;

    const response = await generateResponse(context, prompt);

    // Parse the response to extract suggestions
    const suggestions = parseSuggestionsFromResponse(response.content);

    return {
      suggestions,
      contextSummary: `Analyzed ${analysisMethod} context`,
      analysisMethod,
    };
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return {
      suggestions: getFallbackSuggestions(),
      contextSummary: "Error analyzing context",
      analysisMethod,
    };
  }
}

function parseSuggestionsFromResponse(response: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Split response into lines and look for numbered suggestions
  const lines = response.split("\n");
  let currentSuggestion = "";
  let currentType: Suggestion["type"] = "professional";

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for suggestion type indicators
    if (trimmedLine.toLowerCase().includes("assertive")) {
      currentType = "assertive";
      currentSuggestion = "";
    } else if (trimmedLine.toLowerCase().includes("clarifying")) {
      currentType = "clarifying";
      currentSuggestion = "";
    } else if (trimmedLine.toLowerCase().includes("collaborative")) {
      currentType = "collaborative";
      currentSuggestion = "";
    } else if (trimmedLine.match(/^\d+\./)) {
      // Start of a new numbered suggestion
      if (currentSuggestion.trim()) {
        suggestions.push({
          type: currentType,
          text: currentSuggestion.trim(),
          confidence: 0.8,
        });
      }
      currentSuggestion = trimmedLine.replace(/^\d+\.\s*/, "");
    } else if (
      trimmedLine &&
      !trimmedLine.startsWith("[") &&
      !trimmedLine.endsWith("]")
    ) {
      // Add to current suggestion
      currentSuggestion += (currentSuggestion ? " " : "") + trimmedLine;
    }
  }

  // Add the last suggestion
  if (currentSuggestion.trim()) {
    suggestions.push({
      type: currentType,
      text: currentSuggestion.trim(),
      confidence: 0.8,
    });
  }

  // If we couldn't parse structured suggestions, create generic ones
  if (suggestions.length === 0) {
    return getFallbackSuggestions();
  }

  return suggestions.slice(0, 3); // Ensure we only return 3 suggestions
}

export function formatSuggestionsForSlack(suggestions: Suggestion[]): string {
  let formattedText = "*🤖 Response Suggestions*\n\n";

  suggestions.forEach((suggestion) => {
    const emoji = getEmojiForType(suggestion.type);
    const typeLabel = getTypeLabel(suggestion.type);

    formattedText += `${emoji} *${typeLabel}*\n${suggestion.text}\n\n`;
  });

  formattedText +=
    "_💡 These are suggestions only. Choose the approach that best fits your situation._";

  return formattedText;
}

function getEmojiForType(type: Suggestion["type"]): string {
  switch (type) {
    case "assertive":
      return "💪";
    case "clarifying":
      return "❓";
    case "collaborative":
      return "🤝";
    case "professional":
      return "💼";
    default:
      return "💡";
  }
}

function getTypeLabel(type: Suggestion["type"]): string {
  switch (type) {
    case "assertive":
      return "Assertive Response";
    case "clarifying":
      return "Clarifying Question";
    case "collaborative":
      return "Collaborative Approach";
    case "professional":
      return "Professional Response";
    default:
      return "Suggestion";
  }
}

export function getFallbackSuggestions(): Suggestion[] {
  return [
    {
      type: "professional",
      text: "I understand your question. Let me gather more context to provide a helpful response.",
      confidence: 0.9,
    },
    {
      type: "clarifying",
      text: "Could you provide more details about what you're looking for?",
      confidence: 0.8,
    },
    {
      type: "collaborative",
      text: "This sounds like something we could work on together. What are your thoughts?",
      confidence: 0.7,
    },
  ];
}
