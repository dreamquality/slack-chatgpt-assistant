import { Middleware, SlackEventMiddlewareArgs } from "@slack/bolt";

const userRequestTimestamps: Record<string, number[]> = {};
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;

export const rateLimiter: Middleware<
  SlackEventMiddlewareArgs<"app_mention" | "message">
> = async ({ event, next, context }) => {
  const userId = (event as any).user;
  if (!userId) return next();

  const now = Date.now();
  userRequestTimestamps[userId] = (userRequestTimestamps[userId] || []).filter(
    (ts) => now - ts < WINDOW_MS
  );
  if (userRequestTimestamps[userId].length >= MAX_REQUESTS) {
    // Optionally, you could send a warning message here
    return;
  }
  userRequestTimestamps[userId].push(now);
  await next();
};
