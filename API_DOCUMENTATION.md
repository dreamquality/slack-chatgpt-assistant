# API Documentation

This document provides comprehensive documentation for the Slack Personality & Response Assistant Bot API.

## Overview

The Slack Personality & Response Assistant Bot provides two main functionalities:

1. **Response Suggestions**: Get intelligent, context-aware suggestions for how to reply to messages
2. **Personality Analysis**: Analyze conversation participants' communication styles and personality traits

## Authentication

The bot uses Google OAuth2 for authentication. All protected endpoints require a valid JWT token.

### Authentication Flow

1. **Initiate OAuth2 Flow**

   ```
   GET /auth/google
   ```

   Redirects user to Google OAuth2 consent screen.

2. **OAuth2 Callback**

   ```
   GET /auth/google/callback?code={authorization_code}
   ```

   Handles the OAuth2 callback and creates a user session.

3. **Logout**
   ```
   GET /auth/logout
   ```
   Logs out the current user and clears the session.

## Slack Commands

### Response Suggestions

#### `/suggest [question]`

Get intelligent response suggestions based on recent conversation context.

**Parameters:**

- `question` (optional): Specific question or context for the suggestion

**Example:**

```
/suggest How should I respond to this client's request?
```

**Response:**
Ephemeral message with multiple response suggestions formatted as Slack blocks.

#### @mention Activation

Mention the bot in any channel to get response suggestions.

**Example:**

```
@YourBotName How should I handle this situation?
```

**Response:**
Ephemeral message with context-aware response suggestions.

### Personality Analysis

#### `/personality-analyze`

Analyze the communication styles and personality traits of conversation participants.

**Parameters:**

- None (analyzes recent conversation history)

**Example:**

```
/personality-analyze
```

**Response:**
Ephemeral message with personality profiles for each participant, including:

- Communication style
- Emotional tone
- Key personality traits
- Team role indicators

### Configuration Commands

#### `/config`

Display current user configuration settings.

**Response:**

```
Current Configuration:
• Analysis Method: recent_messages
• Max Context Messages: 1000
• Max Context Days: 30
```

#### `/config-methods`

List available analysis methods.

**Response:**

```
Available Analysis Methods:
• recent_messages - Analyze recent messages (default)
• conversation_thread - Analyze entire conversation thread
• user_history - Analyze user's message history
• channel_summary - Provide channel-wide summary
```

#### `/config-method [method]`

Change the analysis method.

**Parameters:**

- `method`: One of the available analysis methods

**Example:**

```
/config-method conversation_thread
```

#### `/config-reset`

Reset configuration to default values.

**Response:**

```
Configuration reset to defaults:
• Analysis Method: recent_messages
• Max Context Messages: 1000
• Max Context Days: 30
```

## HTTP Endpoints

### Health Checks

#### `GET /health`

Basic health status endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /status`

Detailed status with memory usage and system information.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB",
    "percentage": 8.8
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Authentication Endpoints

#### `GET /auth/google`

Initiates Google OAuth2 authentication flow.

**Response:**
Redirects to Google OAuth2 consent screen.

#### `GET /auth/google/callback`

Handles OAuth2 callback and creates user session.

**Parameters:**

- `code`: Authorization code from Google
- `state`: State parameter for CSRF protection

**Response:**

```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "123456789",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `GET /auth/logout`

Logs out the current user and clears session.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `GET /auth/protected`

Protected endpoint requiring authentication.

**Headers:**

- `Authorization: Bearer <jwt_token>` (optional)
- `Cookie: jwt=<jwt_token>` (optional)

**Response:**

```json
{
  "message": "Access granted",
  "user": {
    "userId": "123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "google"
  }
}
```

## Data Models

### Personality Profile

```typescript
interface PersonalityProfile {
  userId: string;
  username: string;
  communicationStyle: {
    primary: string;
    secondary?: string;
    description: string;
  };
  emotionalTone: {
    dominant: string;
    average: number;
    range: string;
  };
  keyTraits: string[];
  teamRole: {
    primary: string;
    strengths: string[];
    suggestions: string[];
  };
  messageStats: {
    totalMessages: number;
    averageLength: number;
    responseTime: string;
  };
}
```

### Response Suggestion

```typescript
interface ResponseSuggestion {
  id: string;
  content: string;
  confidence: number;
  reasoning: string;
  tone: string;
  length: "short" | "medium" | "long";
}
```

### Analysis Context

```typescript
interface AnalysisContext {
  channelId: string;
  channelName: string;
  participants: {
    userId: string;
    username: string;
    messageCount: number;
  }[];
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
  messageCount: number;
  analysisMethod: string;
}
```

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: User must authenticate
- `INVALID_TOKEN`: JWT token is invalid or expired
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `GEMINI_API_ERROR`: Gemini API error
- `SLACK_API_ERROR`: Slack API error
- `INVALID_REQUEST`: Invalid request parameters
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Slack Commands**: 10 requests per minute per user
- **HTTP Endpoints**: 60 requests per minute per IP
- **Gemini API**: 100 requests per minute per API key

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1642234567
```

## Privacy and Security

### Data Handling

- All analysis results are sent as ephemeral messages (only visible to the requesting user)
- Conversation data is not stored permanently
- Personal information is sanitized before analysis
- JWT tokens are encrypted and have expiration times

### Security Features

- CSRF protection with state parameters
- Input validation and sanitization
- Rate limiting to prevent abuse
- Secure cookie handling
- HTTPS enforcement in production

## Usage Examples

### Complete Workflow Example

1. **User authenticates via Google SSO**

   ```
   GET /auth/google
   ```

2. **User gets response suggestions**

   ```
   /suggest How should I respond to this client?
   ```

3. **User analyzes team personalities**

   ```
   /personality-analyze
   ```

4. **User configures analysis method**
   ```
   /config-method conversation_thread
   ```

### Integration Example

```javascript
// Example of integrating with the bot's HTTP API
const response = await fetch("/auth/protected", {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    "Content-Type": "application/json",
  },
});

const data = await response.json();
console.log("User info:", data.user);
```

## Monitoring and Logging

### Log Levels

- `DEBUG`: Detailed debugging information
- `INFO`: General information about operations
- `WARN`: Warning messages for potential issues
- `ERROR`: Error messages for failed operations

### Key Metrics

- Command usage frequency
- Response generation time
- Error rates by type
- Authentication success/failure rates
- API usage (Gemini, Slack)

### Health Monitoring

Monitor the following endpoints for system health:

- `/health` - Basic health status
- `/status` - Detailed system status

## Support

For API support and questions:

1. Check the logs for detailed error information
2. Verify all required environment variables are set
3. Test authentication flow with `/auth/google`
4. Check rate limiting with response headers
5. Contact the development team with specific error details and request IDs
