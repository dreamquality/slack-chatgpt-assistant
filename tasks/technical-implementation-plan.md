# Technical Implementation Plan: Personality Profile Analysis

## Overview

This document outlines the technical implementation for adding personality profile analysis to the existing Slack ChatGPT Assistant Bot, including Google SSO integration and migration from ChatGPT to Gemini 2.0 Flash.

## Current Architecture Analysis

Based on the existing codebase, we have:

- **Bolt Framework** for Slack integration
- **Modular service architecture** with separate handlers and services
- **TypeScript** for type safety
- **Express.js** server (via Bolt)
- **Environment-based configuration**

## New Architecture Components

### 1. Authentication Layer

```
src/
├── auth/
│   ├── googleAuthService.ts     # Google OAuth2 integration
│   ├── jwtService.ts           # JWT token management
│   └── authMiddleware.ts       # Authentication middleware
├── config/
│   ├── googleAuth.ts           # Google OAuth2 configuration
│   └── gemini.ts              # Gemini API configuration
```

### 2. AI Service Migration

```
src/
├── services/
│   ├── geminiService.ts        # Replace chatgptService.ts
│   ├── personalityAnalyzer.ts  # New personality analysis service
│   └── profileGenerator.ts     # Profile report generation
```

### 3. New Command Handler

```
src/
├── handlers/
│   ├── personalityHandler.ts   # New personality analysis command
│   └── ssoHandler.ts          # SSO callback handlers
```

## Implementation Steps

### Phase 1: Dependencies & Configuration

#### 1.1 Update package.json

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "google-auth-library": "^9.0.0",
    "passport": "^0.6.0",
    "passport-google-oauth20": "^2.0.0",
    "jsonwebtoken": "^9.0.0",
    "cookie-parser": "^1.4.6",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/passport": "^1.0.0",
    "@types/cookie-parser": "^1.4.0"
  }
}
```

#### 1.2 Environment Variables

```bash
# Replace OpenAI with Google/Gemini
GOOGLE_AI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### Phase 2: Authentication Implementation

#### 2.1 Google Auth Service

```typescript
// src/auth/googleAuthService.ts
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );
    const userInfo = await response.json();

    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
  }

  generateJWT(user: GoogleUser): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: "google",
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
  }

  verifyJWT(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}
```

#### 2.2 JWT Service

```typescript
// src/auth/jwtService.ts
import jwt from "jsonwebtoken";

export class JWTService {
  static generateToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }

  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
```

#### 2.3 Auth Middleware

```typescript
// src/auth/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { JWTService } from "./jwtService";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.jwt || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = JWTService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.jwt || req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = JWTService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without auth
    }
  }

  next();
};
```

### Phase 3: Gemini Service Implementation

#### 3.1 Gemini Configuration

```typescript
// src/config/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export const geminiConfig = {
  apiKey: process.env.GOOGLE_AI_API_KEY!,
  model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
  maxTokens: Number(process.env.GEMINI_MAX_TOKENS) || 2048,
  temperature: Number(process.env.GEMINI_TEMPERATURE) || 0.7,
};

export function createGeminiClient(): GoogleGenerativeAI {
  if (!geminiConfig.apiKey) {
    throw new Error("GOOGLE_AI_API_KEY environment variable is required");
  }

  return new GoogleGenerativeAI(geminiConfig.apiKey);
}
```

#### 3.2 Gemini Service

```typescript
// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGeminiClient, geminiConfig } from "../config/gemini";

export interface GeminiResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GeminiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function generateResponse(
  prompt: string,
  userId?: string
): Promise<GeminiResponse> {
  const genAI = createGeminiClient();
  const model = genAI.getGenerativeModel({
    model: geminiConfig.model,
    generationConfig: {
      maxOutputTokens: geminiConfig.maxTokens,
      temperature: geminiConfig.temperature,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text || "Sorry, I could not generate a response.",
      usage: {
        prompt_tokens: result.response.usageMetadata?.promptTokenCount || 0,
        completion_tokens:
          result.response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens:
          (result.response.usageMetadata?.promptTokenCount || 0) +
          (result.response.usageMetadata?.candidatesTokenCount || 0),
      },
    };
  } catch (error: any) {
    console.error("Gemini API error:", error);

    if (error.status === 429) {
      throw new GeminiError(
        "Rate limit exceeded. Please try again in a moment.",
        "RATE_LIMIT"
      );
    } else if (error.status === 401) {
      throw new GeminiError(
        "Authentication failed. Please check your API key.",
        "AUTH_ERROR"
      );
    } else {
      throw new GeminiError(
        "Failed to generate response. Please try again.",
        "API_ERROR"
      );
    }
  }
}
```

### Phase 4: Personality Analysis Service

#### 4.1 Personality Analyzer

```typescript
// src/services/personalityAnalyzer.ts
import { generateResponse } from "./geminiService";
import { logger } from "../utils/logger";

export interface PersonalityProfile {
  userId: string;
  userName: string;
  communicationStyle: string;
  emotionalTone: string;
  keyTraits: string[];
  communicationPatterns: {
    responseTime: string;
    messageLength: string;
    formality: string;
  };
  role: string;
  preferences: string[];
  recommendations: string[];
}

export interface ConversationParticipant {
  userId: string;
  userName: string;
  messageCount: number;
  messages: string[];
}

export class PersonalityAnalyzer {
  async analyzePersonalities(
    participants: ConversationParticipant[]
  ): Promise<PersonalityProfile[]> {
    if (participants.length <= 1) {
      throw new Error("Cannot analyze personality for a single participant");
    }

    const profiles: PersonalityProfile[] = [];

    for (const participant of participants) {
      try {
        const profile = await this.analyzeSinglePersonality(participant);
        profiles.push(profile);
      } catch (error) {
        logger.error(
          `Failed to analyze personality for ${participant.userName}`,
          { error }
        );
        // Skip this participant and continue with others
      }
    }

    return profiles;
  }

  private async analyzeSinglePersonality(
    participant: ConversationParticipant
  ): Promise<PersonalityProfile> {
    const prompt = this.buildPersonalityAnalysisPrompt(participant);

    const response = await generateResponse(prompt, participant.userId);

    return this.parsePersonalityResponse(response.content, participant);
  }

  private buildPersonalityAnalysisPrompt(
    participant: ConversationParticipant
  ): string {
    return `Analyze the personality and communication style of a Slack user based on their messages.

User: ${participant.userName}
Message Count: ${participant.messageCount}
Messages: ${participant.messages.join("\n")}

Please provide a personality analysis in the following JSON format:
{
  "communicationStyle": "direct/indirect, formal/informal",
  "emotionalTone": "positive/negative/neutral",
  "keyTraits": ["trait1", "trait2", "trait3"],
  "communicationPatterns": {
    "responseTime": "fast/slow/medium",
    "messageLength": "short/medium/long",
    "formality": "formal/informal/mixed"
  },
  "role": "leader/supporter/critic/coordinator",
  "preferences": ["preference1", "preference2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Focus on communication patterns, emotional expression, and interaction style.`;
  }

  private parsePersonalityResponse(
    response: string,
    participant: ConversationParticipant
  ): PersonalityProfile {
    try {
      const parsed = JSON.parse(response);

      return {
        userId: participant.userId,
        userName: participant.userName,
        communicationStyle: parsed.communicationStyle || "unknown",
        emotionalTone: parsed.emotionalTone || "neutral",
        keyTraits: parsed.keyTraits || [],
        communicationPatterns: parsed.communicationPatterns || {
          responseTime: "unknown",
          messageLength: "unknown",
          formality: "unknown",
        },
        role: parsed.role || "participant",
        preferences: parsed.preferences || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      logger.error("Failed to parse personality response", { error, response });

      // Return default profile if parsing fails
      return {
        userId: participant.userId,
        userName: participant.userName,
        communicationStyle: "unknown",
        emotionalTone: "neutral",
        keyTraits: [],
        communicationPatterns: {
          responseTime: "unknown",
          messageLength: "unknown",
          formality: "unknown",
        },
        role: "participant",
        preferences: [],
        recommendations: [],
      };
    }
  }
}
```

### Phase 5: Profile Generator

#### 5.1 Profile Generator Service

```typescript
// src/services/profileGenerator.ts
import { PersonalityProfile } from "./personalityAnalyzer";

export interface ProfileReport {
  text: string;
  blocks: any[]; // Slack Block Kit blocks
}

export class ProfileGenerator {
  generateReport(profiles: PersonalityProfile[]): ProfileReport {
    const text = this.generateTextReport(profiles);
    const blocks = this.generateSlackBlocks(profiles);

    return { text, blocks };
  }

  private generateTextReport(profiles: PersonalityProfile[]): string {
    let report = "🎭 *Personality Profile Analysis*\n\n";

    for (const profile of profiles) {
      report += `*${profile.userName}*\n`;
      report += `• Communication Style: ${profile.communicationStyle}\n`;
      report += `• Emotional Tone: ${profile.emotionalTone}\n`;
      report += `• Key Traits: ${profile.keyTraits.join(", ")}\n`;
      report += `• Role: ${profile.role}\n`;
      report += `• Message Length: ${profile.communicationPatterns.messageLength}\n`;
      report += `• Formality: ${profile.communicationPatterns.formality}\n\n`;

      if (profile.recommendations.length > 0) {
        report += `*Recommendations for communicating with ${profile.userName}:*\n`;
        profile.recommendations.forEach((rec) => {
          report += `• ${rec}\n`;
        });
        report += "\n";
      }
    }

    return report;
  }

  private generateSlackBlocks(profiles: PersonalityProfile[]): any[] {
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎭 Personality Profile Analysis",
          emoji: true,
        },
      },
      {
        type: "divider",
      },
    ];

    for (const profile of profiles) {
      blocks.push(
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${profile.userName}*`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Communication Style:*\n${profile.communicationStyle}`,
            },
            {
              type: "mrkdwn",
              text: `*Emotional Tone:*\n${profile.emotionalTone}`,
            },
            {
              type: "mrkdwn",
              text: `*Role:*\n${profile.role}`,
            },
            {
              type: "mrkdwn",
              text: `*Formality:*\n${profile.communicationPatterns.formality}`,
            },
          ],
        }
      );

      if (profile.keyTraits.length > 0) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Key Traits:* ${profile.keyTraits.join(", ")}`,
          },
        });
      }

      if (profile.recommendations.length > 0) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Recommendations for communicating with ${
              profile.userName
            }:*\n${profile.recommendations
              .map((rec) => `• ${rec}`)
              .join("\n")}`,
          },
        });
      }

      blocks.push({ type: "divider" });
    }

    return blocks;
  }
}
```

### Phase 6: Command Handler

#### 6.1 Personality Handler

```typescript
// src/handlers/personalityHandler.ts
import { App } from "@slack/bolt";
import { PersonalityAnalyzer } from "../services/personalityAnalyzer";
import { ProfileGenerator } from "../services/profileGenerator";
import { logger } from "../utils/logger";
import { rateLimiter } from "../middleware/rateLimiter";

export function registerPersonalityHandler(app: App) {
  app.command(
    "/personality-analyze",
    rateLimiter,
    async ({ command, ack, respond }) => {
      await ack();

      try {
        const channelId = command.channel_id;
        const userId = command.user_id;

        // Get conversation history
        const history = await app.client.conversations.history({
          channel: channelId,
          limit: 1000, // Get last 1000 messages
        });

        if (!history.messages || history.messages.length === 0) {
          await respond({
            text: "No conversation history found to analyze.",
            response_type: "ephemeral",
          });
          return;
        }

        // Extract participants and their messages
        const participants = extractParticipants(history.messages);

        if (participants.length <= 1) {
          await respond({
            text: "Cannot analyze personality for a single participant. Need at least 2 people in the conversation.",
            response_type: "ephemeral",
          });
          return;
        }

        // Analyze personalities
        const analyzer = new PersonalityAnalyzer();
        const profiles = await analyzer.analyzePersonalities(participants);

        // Generate report
        const generator = new ProfileGenerator();
        const report = generator.generateReport(profiles);

        // Send response
        await respond({
          text: report.text,
          blocks: report.blocks,
          response_type: "ephemeral",
        });
      } catch (error) {
        logger.error("Error in personality analysis", { error });

        await respond({
          text: "Sorry, I encountered an error while analyzing personalities. Please try again later.",
          response_type: "ephemeral",
        });
      }
    }
  );
}

function extractParticipants(messages: any[]): any[] {
  const participantMap = new Map();

  for (const message of messages) {
    if (message.bot_id) continue; // Skip bot messages

    const userId = message.user;
    if (!participantMap.has(userId)) {
      participantMap.set(userId, {
        userId,
        userName: message.username || `User ${userId}`,
        messageCount: 0,
        messages: [],
      });
    }

    const participant = participantMap.get(userId);
    participant.messageCount++;
    participant.messages.push(message.text);
  }

  return Array.from(participantMap.values());
}
```

### Phase 7: SSO Integration

#### 7.1 SSO Handler

```typescript
// src/handlers/ssoHandler.ts
import { App } from "@slack/bolt";
import { GoogleAuthService } from "../auth/googleAuthService";
import { logger } from "../utils/logger";

const authService = new GoogleAuthService();

export function registerSSOHandler(app: App) {
  // Google OAuth2 initiation
  app.get("/auth/google", (req, res) => {
    const authUrl = authService.getAuthUrl();
    res.redirect(authUrl);
  });

  // Google OAuth2 callback
  app.get("/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ error: "Authorization code required" });
      }

      const tokens = await authService.getTokens(code as string);
      const userInfo = await authService.getUserInfo(tokens.access_token!);
      const jwt = authService.generateJWT(userInfo);

      // Store JWT in httpOnly cookie
      res.cookie("jwt", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.redirect("/dashboard");
    } catch (error) {
      logger.error("SSO callback error", { error });
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Logout
  app.get("/auth/logout", (req, res) => {
    res.clearCookie("jwt");
    res.redirect("/");
  });

  // Get current user
  app.get("/auth/me", (req, res) => {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = authService.verifyJWT(token);
      res.json({ user });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
```

### Phase 8: App Integration

#### 8.1 Updated app.ts

```typescript
// src/app.ts (updated)
import { createSlackApp } from "./config/slack";
import { registerMentionHandler } from "./handlers/mentionHandler";
import { registerConfigHandler } from "./handlers/configHandler";
import { registerPersonalityHandler } from "./handlers/personalityHandler";
import { registerSSOHandler } from "./handlers/ssoHandler";
import { App } from "@slack/bolt";
import { rateLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";
import { getEnvironmentConfig } from "./config/environments";
import { Request, Response } from "express";
import cookieParser from "cookie-parser";

function registerMessageEventHandler(app: App) {
  app.event("message", rateLimiter, async () => {
    // Placeholder for future message event handling
  });
}

function setupHealthCheck(app: App) {
  const expressApp = (app as any).receiver?.app;
  if (expressApp) {
    // Add cookie parser middleware
    expressApp.use(cookieParser());

    expressApp.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    expressApp.get("/status", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "running",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        memory: process.memoryUsage(),
      });
    });
  }
}

async function startApp() {
  const config = getEnvironmentConfig();
  const app = createSlackApp();

  // Register event handlers
  app.event("app_mention", rateLimiter);
  registerMentionHandler(app);
  registerConfigHandler(app);
  registerPersonalityHandler(app); // New personality handler
  registerSSOHandler(app); // New SSO handler
  registerMessageEventHandler(app);

  // Setup health checks
  setupHealthCheck(app);

  try {
    await app.start(config.port);
    logger.info(
      `⚡️ Slack Personality Analysis Bot is running on port ${config.port}!`,
      {
        environment: config.nodeEnv,
        port: config.port,
      }
    );
  } catch (error) {
    logger.error("Failed to start Slack app", {
      error: (error as Error).message,
    });
    process.exit(1);
  }
}

startApp();
```

## Migration Strategy

### Step 1: Add Dependencies

```bash
npm install @google/generative-ai google-auth-library passport passport-google-oauth20 jsonwebtoken cookie-parser
npm install --save-dev @types/jsonwebtoken @types/passport @types/cookie-parser
```

### Step 2: Update Environment Variables

```bash
# Add to .env
GOOGLE_AI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### Step 3: Create New Files

- Create all the new service and handler files as outlined above
- Update existing files to use new services

### Step 4: Test Integration

- Test Google SSO flow
- Test Gemini API integration
- Test personality analysis command
- Test error handling and edge cases

### Step 5: Deploy

- Update production environment variables
- Deploy new code
- Monitor logs for any issues

## Testing Strategy

### Unit Tests

- Test personality analysis logic
- Test JWT token management
- Test profile generation

### Integration Tests

- Test Slack command integration
- Test Google SSO flow
- Test Gemini API calls

### End-to-End Tests

- Test complete user flow from command to report
- Test error scenarios
- Test rate limiting

## Monitoring & Logging

### Key Metrics

- Command usage frequency
- Analysis completion time
- Error rates
- API usage (Gemini)

### Logging

- User authentication events
- Analysis requests and results
- API errors and retries
- Performance metrics

This implementation plan provides a complete roadmap for adding personality analysis with Google SSO and Gemini 2.0 Flash to your existing Slack bot while maintaining the current architecture and adding new capabilities seamlessly.
