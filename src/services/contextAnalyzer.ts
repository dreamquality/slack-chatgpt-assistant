import { WebClient } from "@slack/web-api";

export interface ConversationHistoryOptions {
  channel: string;
  latest?: string;
  oldest?: string;
  limit?: number;
  thread_ts?: string;
}

export async function fetchConversationHistory(
  client: WebClient,
  options: ConversationHistoryOptions
) {
  const { channel, latest, oldest, limit = 100, thread_ts } = options;

  if (thread_ts) {
    // Fetch thread replies
    const args: any = { channel, ts: thread_ts, limit };
    if (latest !== undefined) args.latest = latest;
    if (oldest !== undefined) args.oldest = oldest;
    const replies = await client.conversations.replies(args);
    return replies.messages || [];
  } else {
    // Fetch channel history
    const args: any = { channel, limit };
    if (latest !== undefined) args.latest = latest;
    if (oldest !== undefined) args.oldest = oldest;
    const history = await client.conversations.history(args);
    return history.messages || [];
  }
}

// Fetch up to one month of message history (handling pagination)
export async function fetchMonthHistory(
  client: WebClient,
  channel: string,
  thread_ts?: string,
  maxDays = 30,
  maxMessages = 1000
) {
  const now = Math.floor(Date.now() / 1000);
  const oldest = now - maxDays * 24 * 60 * 60;
  let messages: any[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore && messages.length < maxMessages) {
    let result;
    if (thread_ts) {
      const args: any = {
        channel,
        ts: thread_ts,
        limit: 200,
        oldest: oldest.toString(),
      };
      if (cursor !== undefined) args.cursor = cursor;
      result = await client.conversations.replies(args);
    } else {
      const args: any = { channel, limit: 200, oldest: oldest.toString() };
      if (cursor !== undefined) args.cursor = cursor;
      result = await client.conversations.history(args);
    }
    messages = messages.concat(result.messages || []);
    cursor = result.response_metadata?.next_cursor;
    hasMore = !!cursor;
    if (result.messages && result.messages.length === 0) break;
  }
  return messages.slice(0, maxMessages);
}

export interface ProcessedMessage {
  user: string;
  text: string;
  ts: string;
  reactions: string[];
  thread_ts?: string;
}

export function extractTextAndReactions(messages: any[]): ProcessedMessage[] {
  return messages
    .filter((msg) => msg.type === "message" && !msg.subtype)
    .map((msg) => ({
      user: msg.user,
      text: msg.text,
      ts: msg.ts,
      reactions: (msg.reactions || []).flatMap((r: any) =>
        Array(r.count).fill(r.name)
      ),
      thread_ts: msg.thread_ts,
    }));
}

export function filterAndCleanMessages(messages: any[]): ProcessedMessage[] {
  return extractTextAndReactions(messages)
    .filter((msg) => !!msg.user && msg.text.trim() !== "")
    .map((msg) => ({
      ...msg,
      text: cleanText(msg.text),
    }));
}

function cleanText(text: string): string {
  // Remove Slack formatting, excessive whitespace, and bot artifacts
  return text
    .replace(/<@\w+>/g, "") // Remove user mentions
    .replace(/<#[A-Z0-9]+\|[^>]+>/g, "") // Remove channel mentions
    .replace(/<[^>]+>/g, "") // Remove URLs and other Slack markup
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

export function summarizeContext(
  messages: ProcessedMessage[],
  maxTokens = 2000
): string {
  // Simple summarization: concatenate messages up to a rough token limit
  // (Assume 4 characters per token as a rough estimate)
  let summary = "";
  let tokenCount = 0;
  for (const msg of messages) {
    const line = `[${msg.user}] ${msg.text}\n`;
    const lineTokens = Math.ceil(line.length / 4);
    if (tokenCount + lineTokens > maxTokens) break;
    summary += line;
    tokenCount += lineTokens;
  }
  return summary.trim();
}

export function analyzeFullHistory(
  messages: ProcessedMessage[]
): ProcessedMessage[] {
  return messages;
}

export function analyzeRecentMessages(
  messages: ProcessedMessage[],
  days = 7
): ProcessedMessage[] {
  const now = Date.now() / 1000;
  const cutoff = now - days * 24 * 60 * 60;
  return messages.filter((msg) => Number(msg.ts) >= cutoff);
}

export function analyzeThread(
  messages: ProcessedMessage[],
  thread_ts: string
): ProcessedMessage[] {
  return messages.filter(
    (msg) => msg.thread_ts === thread_ts || msg.ts === thread_ts
  );
}

export function filterByKeywords(
  messages: ProcessedMessage[],
  keywords: string[]
): ProcessedMessage[] {
  if (!keywords.length) return messages;
  return messages.filter((msg) =>
    keywords.some((kw) => msg.text.toLowerCase().includes(kw.toLowerCase()))
  );
}

const contextCache: Record<
  string,
  { data: ProcessedMessage[]; expires: number }
> = {};
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS) || 300000; // 5 minutes

export function getCachedContext(key: string): ProcessedMessage[] | undefined {
  const entry = contextCache[key];
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  return undefined;
}

export function setCachedContext(key: string, data: ProcessedMessage[]): void {
  contextCache[key] = {
    data,
    expires: Date.now() + CACHE_TTL_MS,
  };
}
