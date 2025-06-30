"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: ".env.test" });
process.env.NODE_ENV = "test";
process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
process.env.SLACK_SIGNING_SECRET = "test-signing-secret";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/auth/google/callback";
process.env.GEMINI_API_KEY = "test-gemini-api-key";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.SLACK_APP_TOKEN = "";
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
jest.setTimeout(10000);
afterEach(() => {
    jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map