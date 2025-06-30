// Jest test setup file
import { config } from "dotenv";

// Load environment variables for testing
config({ path: ".env.test" });

// Set up test environment variables
process.env.NODE_ENV = "test";
process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
process.env.SLACK_SIGNING_SECRET = "test-signing-secret";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/auth/google/callback";
process.env.GEMINI_API_KEY = "test-gemini-api-key";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.SLACK_APP_TOKEN = ""; // Force HTTP mode for tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
