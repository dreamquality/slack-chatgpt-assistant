// Jest test setup file
import { config } from "dotenv";

// Load environment variables for testing
config({ path: ".env.test" });

// Set up test environment
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
