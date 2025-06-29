"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const requestCounts = new Map();
const rateLimiter = async ({ event, next }) => {
    const userId = event.user;
    if (!userId)
        return next();
    const now = Date.now();
    const windowMs = 60000;
    const maxRequests = 10;
    const userRequests = requestCounts.get(userId);
    if (!userRequests || now > userRequests.resetTime) {
        requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
    }
    else if (userRequests.count >= maxRequests) {
        console.warn(`Rate limit exceeded for user ${userId}`);
        return;
    }
    else {
        userRequests.count++;
    }
    await next();
};
exports.rateLimiter = rateLimiter;
//# sourceMappingURL=rateLimiter.js.map