"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchConversationHistory = fetchConversationHistory;
exports.fetchMonthHistory = fetchMonthHistory;
exports.extractTextAndReactions = extractTextAndReactions;
exports.filterAndCleanMessages = filterAndCleanMessages;
exports.summarizeContext = summarizeContext;
exports.analyzeFullHistory = analyzeFullHistory;
exports.analyzeRecentMessages = analyzeRecentMessages;
exports.analyzeThread = analyzeThread;
exports.filterByKeywords = filterByKeywords;
exports.getCachedContext = getCachedContext;
exports.setCachedContext = setCachedContext;
async function fetchConversationHistory(client, options) {
    const { channel, latest, oldest, limit = 100, thread_ts } = options;
    if (thread_ts) {
        const args = { channel, ts: thread_ts, limit };
        if (latest !== undefined)
            args.latest = latest;
        if (oldest !== undefined)
            args.oldest = oldest;
        const replies = await client.conversations.replies(args);
        return replies.messages || [];
    }
    else {
        const args = { channel, limit };
        if (latest !== undefined)
            args.latest = latest;
        if (oldest !== undefined)
            args.oldest = oldest;
        const history = await client.conversations.history(args);
        return history.messages || [];
    }
}
async function fetchMonthHistory(client, channel, thread_ts, maxDays = 30, maxMessages = 1000) {
    const now = Math.floor(Date.now() / 1000);
    const oldest = now - maxDays * 24 * 60 * 60;
    let messages = [];
    let cursor = undefined;
    let hasMore = true;
    while (hasMore && messages.length < maxMessages) {
        let result;
        if (thread_ts) {
            const args = {
                channel,
                ts: thread_ts,
                limit: 200,
                oldest: oldest.toString(),
            };
            if (cursor !== undefined)
                args.cursor = cursor;
            result = await client.conversations.replies(args);
        }
        else {
            const args = { channel, limit: 200, oldest: oldest.toString() };
            if (cursor !== undefined)
                args.cursor = cursor;
            result = await client.conversations.history(args);
        }
        messages = messages.concat(result.messages || []);
        cursor = result.response_metadata?.next_cursor;
        hasMore = !!cursor;
        if (result.messages && result.messages.length === 0)
            break;
    }
    return messages.slice(0, maxMessages);
}
function extractTextAndReactions(messages) {
    return messages
        .filter((msg) => msg.type === "message" && !msg.subtype)
        .map((msg) => ({
        user: msg.user,
        text: msg.text,
        ts: msg.ts,
        reactions: (msg.reactions || []).flatMap((r) => Array(r.count).fill(r.name)),
        thread_ts: msg.thread_ts,
    }));
}
function filterAndCleanMessages(messages) {
    return extractTextAndReactions(messages)
        .filter((msg) => !!msg.user && msg.text.trim() !== "")
        .map((msg) => ({
        ...msg,
        text: cleanText(msg.text),
    }));
}
function cleanText(text) {
    return text
        .replace(/<@\w+>/g, "")
        .replace(/<#[A-Z0-9]+\|[^>]+>/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function summarizeContext(messages, maxTokens = 2000) {
    let summary = "";
    let tokenCount = 0;
    for (const msg of messages) {
        const line = `[${msg.user}] ${msg.text}\n`;
        const lineTokens = Math.ceil(line.length / 4);
        if (tokenCount + lineTokens > maxTokens)
            break;
        summary += line;
        tokenCount += lineTokens;
    }
    return summary.trim();
}
function analyzeFullHistory(messages) {
    return messages;
}
function analyzeRecentMessages(messages, days = 7) {
    const now = Date.now() / 1000;
    const cutoff = now - days * 24 * 60 * 60;
    return messages.filter((msg) => Number(msg.ts) >= cutoff);
}
function analyzeThread(messages, thread_ts) {
    return messages.filter((msg) => msg.thread_ts === thread_ts || msg.ts === thread_ts);
}
function filterByKeywords(messages, keywords) {
    if (!keywords.length)
        return messages;
    return messages.filter((msg) => keywords.some((kw) => msg.text.toLowerCase().includes(kw.toLowerCase())));
}
const contextCache = {};
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS) || 300000;
function getCachedContext(key) {
    const entry = contextCache[key];
    if (entry && entry.expires > Date.now()) {
        return entry.data;
    }
    return undefined;
}
function setCachedContext(key, data) {
    contextCache[key] = {
        data,
        expires: Date.now() + CACHE_TTL_MS,
    };
}
//# sourceMappingURL=contextAnalyzer.js.map