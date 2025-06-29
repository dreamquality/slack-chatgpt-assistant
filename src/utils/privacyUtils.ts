import { WebClient } from "@slack/web-api";

export interface EphemeralMessageOptions {
  channel: string;
  user: string;
  text: string;
  thread_ts?: string;
  attachments?: any[];
}

export async function sendEphemeralMessage(
  client: WebClient,
  options: EphemeralMessageOptions
): Promise<void> {
  try {
    const messageOptions: any = {
      channel: options.channel,
      user: options.user,
      text: options.text,
      as_user: true,
    };

    if (options.thread_ts) {
      messageOptions.thread_ts = options.thread_ts;
    }

    if (options.attachments) {
      messageOptions.attachments = options.attachments;
    }

    await client.chat.postEphemeral(messageOptions);
  } catch (error) {
    console.error("Failed to send ephemeral message:", error);
    throw error;
  }
}

export function isPrivateChannel(channelId: string): boolean {
  // Private channels start with 'G' in Slack
  return channelId.startsWith("G");
}

export function sanitizeMessageForPrivacy(text: string): string {
  // Remove any potentially sensitive information from messages
  return text
    .replace(/xoxb-[a-zA-Z0-9-]+/g, "[BOT_TOKEN]") // Remove bot tokens
    .replace(/sk-[a-zA-Z0-9-]+/g, "[API_KEY]") // Remove API keys
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[CARD_NUMBER]") // Remove credit card numbers
    .trim();
}

export function createSuggestionAttachments(suggestions: any[]): any[] {
  return suggestions.map((suggestion, index) => ({
    text: suggestion.content,
    color: getSuggestionColor(suggestion.type),
    actions: [
      {
        name: "use_response",
        text: "Use This Response",
        type: "button",
        value: `use_${index}`,
        style: "primary",
      },
      {
        name: "modify_response",
        text: "Modify",
        type: "button",
        value: `modify_${index}`,
      },
    ],
    footer: `Suggestion ${index + 1} of ${suggestions.length}`,
  }));
}

function getSuggestionColor(type: string): string {
  switch (type) {
    case "template":
      return "#36a64f";
    case "improvement":
      return "#ff9500";
    case "clarifying_question":
      return "#007cba";
    case "summary":
      return "#6b4c9a";
    default:
      return "#95a5a6";
  }
}

export function handleSuggestionAction(
  action: string,
  suggestions: any[]
): { type: "use" | "modify"; index: number; content: string } | null {
  const match = action.match(/^(use|modify)_(\d+)$/);
  if (!match) return null;

  const [, actionType, indexStr] = match;
  const index = parseInt(indexStr, 10);

  if (index < 0 || index >= suggestions.length) return null;

  return {
    type: actionType as "use" | "modify",
    index,
    content: suggestions[index].content,
  };
}

export function createModificationPrompt(originalContent: string): string {
  return `Here's the original suggestion:\n\n"${originalContent}"\n\nPlease provide your modifications or improvements:`;
}

export function createContextIndicator(
  userQuestion: string,
  messageCount: number
): string {
  const truncatedQuestion =
    userQuestion.length > 100
      ? userQuestion.substring(0, 100) + "..."
      : userQuestion;

  return `*📋 Analyzing context for:* "${truncatedQuestion}"\n*📊 Messages analyzed:* ${messageCount}`;
}

export function createLoadingMessage(): string {
  return "*⏳ Analyzing conversation context and generating suggestions...*\n\nThis may take a few seconds.";
}

export function createLoadingAttachments(): any[] {
  return [
    {
      text: "🤖 AI is thinking...",
      color: "#95a5a6",
      footer: "Please wait while I analyze the conversation",
    },
  ];
}

export function createErrorMessage(error: Error): string {
  return `*❌ Error:* ${error.message}\n\nPlease try again or contact support if the problem persists.`;
}

export function createErrorAttachments(error: Error): any[] {
  return [
    {
      text: `Error: ${error.message}`,
      color: "#e74c3c",
      footer: "Try again or contact support",
    },
  ];
}

export function createPrivacyIndicator(): string {
  return "*🔒 This response is private and only visible to you*";
}

export function addPrivacyFooter(attachments: any[]): any[] {
  return attachments.map((attachment) => ({
    ...attachment,
    footer: attachment.footer
      ? `${attachment.footer} • Private response`
      : "Private response",
  }));
}
