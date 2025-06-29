import { Middleware, SlackEventMiddlewareArgs } from "@slack/bolt";

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter: Middleware<
  SlackEventMiddlewareArgs<"app_mention" | "message">
> = async ({ event, next }) => {
  const userId = (event as any).user;
  if (!userId) return next();

  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  const userRequests = requestCounts.get(userId);

  if (!userRequests || now > userRequests.resetTime) {
    // Reset or initialize user's request count
    requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
  } else if (userRequests.count >= maxRequests) {
    // Rate limit exceeded
    console.warn(`Rate limit exceeded for user ${userId}`);
    return; // Don't call next(), effectively blocking the request
  } else {
    // Increment request count
    userRequests.count++;
  }

  await next();
};
