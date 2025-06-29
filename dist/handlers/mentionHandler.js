"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMentionHandler = registerMentionHandler;
const privacyUtils_1 = require("../utils/privacyUtils");
function registerMentionHandler(app) {
    app.event("app_mention", async ({ event, client }) => {
        if (!event.user || !event.channel) {
            console.warn("Missing user or channel in app_mention event");
            return;
        }
        await (0, privacyUtils_1.sendEphemeralMessage)(client, {
            channel: event.channel,
            user: event.user,
            text: `Hi <@${event.user}>! I'm here to help you with conversation context and response suggestions. Mention me in any conversation and I'll analyze the context to provide helpful suggestions.`,
            thread_ts: event.ts,
        });
    });
}
//# sourceMappingURL=mentionHandler.js.map