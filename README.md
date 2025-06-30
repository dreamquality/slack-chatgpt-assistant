# Slack Personality & Response Assistant Bot

A Slack bot that uses Google's Gemini 2.0 Flash AI to analyze conversation context and provide both intelligent response suggestions and personality profiles. The bot helps teams quickly respond to complex questions and understand team dynamics by analyzing conversation history and generating actionable insights.

## Features

- 🤖 **Gemini-Powered Response Suggestions**: Get smart, context-aware suggestions for how to reply to any message
- 💬 **@mention Activation**: Mention the bot in any channel to get instant suggestions
- 📝 **/suggest Command**: Use `/suggest [your question]` for explicit suggestions
- 🎭 **Personality Profile Analysis**: Analyze communication styles, emotional tones, and key traits with `/personality-analyze`
- 🔐 **Google SSO Authentication**: Secure authentication using Google OAuth2
- 🌍 **Multi-language Support**: Analyzes conversations in multiple languages
- 🔒 **Privacy First**: All results are private and only visible to the requesting user
- ⚙️ **Flexible Configuration**: Multiple analysis methods and user-configurable settings

## Quick Start

### Prerequisites

- Node.js 18+
- Slack App with appropriate permissions
- Google Cloud Project with Gemini API enabled
- Google OAuth2 credentials for SSO

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd slack-personality-analysis-bot
```

2. Install dependencies:

```bash
npm install
```

3. Copy environment template:

```bash
cp env.example .env
```

4. Configure your environment variables in `.env`:

   - Add your Slack bot token, signing secret, and app token
   - Add your Google Gemini API key
   - Configure Google OAuth2 credentials for SSO
   - Configure other settings as needed

5. Build the project:

```bash
npm run build
```

6. Start the bot:

```bash
npm start
```

### Development

For development with auto-reload:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Usage

### 1. **Get Response Suggestions**

- **@mention the bot** in any channel with a question or request:

  ```
  @YourBotName How should I respond to this client?
  ```

  The bot will analyze the conversation and provide several Gemini-powered response suggestions as an ephemeral message.

- **Use the `/suggest` command** for explicit suggestions:
  ```
  /suggest How should I respond to this client?
  ```
  The bot will analyze the recent conversation and provide suggestions.

### 2. **Analyze Personality Profiles**

- **Use the `/personality-analyze` command** in any channel with multiple participants:
  ```
  /personality-analyze
  ```
  The bot will analyze the conversation history and generate personality profiles for each participant.

### 3. **Authentication**

- The bot supports Google SSO for secure authentication:
  1. Visit `/auth/google` to initiate Google OAuth2 login
  2. Complete the authentication flow
  3. Access protected features with your authenticated session
  4. Use `/auth/logout` to sign out

### 4. **Configuration**

- Use the `/config` command to configure analysis methods:
  - Full month history analysis
  - Recent messages focus
  - Thread-specific analysis
  - Keyword-based filtering

## Architecture

### System Overview

The Slack Personality & Response Assistant Bot follows a modular architecture with clear separation of concerns. Here's how the different services interact:

```mermaid
graph TB
    %% External Services
    Slack[Slack Platform] --> |commands| Bot[Slack Bot App]
    Bot --> |API calls| Slack
    Google[Google OAuth2] --> |SSO| Bot
    Gemini[Gemini AI] --> |analysis| Bot

    %% Core Application Components
    Bot --> |HTTP requests| Bolt[Bolt Framework]
    Bolt --> |events| Handlers[Event Handlers]
    Handlers --> |analyze| PersonalityAnalyzer[Personality Analyzer Service]
    Handlers --> |suggest| SuggestionGenerator[Suggestion Generator]
    PersonalityAnalyzer --> |fetch history| SlackAPI[Slack API]
    SuggestionGenerator --> |fetch history| SlackAPI
    SlackAPI --> |message data| PersonalityAnalyzer
    SlackAPI --> |message data| SuggestionGenerator

    %% AI Integration
    PersonalityAnalyzer --> |context| GeminiService[Gemini Service]
    SuggestionGenerator --> |context| GeminiService
    GeminiService --> |API calls| Gemini
    Gemini --> |personality insights| GeminiService
    Gemini --> |suggestions| GeminiService
    GeminiService --> |profiles| ProfileGenerator[Profile Generator]

    %% Authentication
    SSOHandler[SSO Handler] --> |OAuth2| Google
    AuthMiddleware[Auth Middleware] --> |protect| Handlers

    %% Response Flow
    ProfileGenerator --> |reports| Handlers
    SuggestionGenerator --> |suggestions| Handlers
    Handlers --> |ephemeral| Bolt
    Bolt --> |private| Slack

    %% Configuration
    ConfigService[Config Service] --> |preferences| PersonalityAnalyzer
    ConfigService --> |methods| ProfileGenerator

    %% Middleware
    RateLimiter[Rate Limiter] --> |throttle| Bolt
    ErrorHandler[Error Handler] --> |handle errors| Handlers
    Logger[Logger] --> |monitor| Bot

    %% Data Flow
    subgraph "Data Processing"
        PrivacyUtils[Privacy Utils] --> |sanitize| PersonalityAnalyzer
        PrivacyUtils --> |sanitize| SuggestionGenerator
        Logger --> |log| Bot
    end

    %% Styling
    classDef external fill:#e1f5fe
    classDef core fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef middleware fill:#fff3e0

    class Slack,Google,Gemini external
    class Bot,Bolt,Handlers core
    class PersonalityAnalyzer,GeminiService,ProfileGenerator,SuggestionGenerator,ConfigService service
    class RateLimiter,ErrorHandler,PrivacyUtils,Logger,SSOHandler,AuthMiddleware middleware
```

### Service Responsibilities

| Service                  | Responsibility          | Key Functions                                  |
| ------------------------ | ----------------------- | ---------------------------------------------- |
| **Bolt Framework**       | Slack integration layer | Event routing, API communication               |
| **Event Handlers**       | Request processing      | Command handling, SSO processing, suggestions  |
| **Personality Analyzer** | Conversation analysis   | History retrieval, participant extraction      |
| **Suggestion Generator** | Response suggestions    | Gemini-powered suggestions, context analysis   |
| **Gemini Service**       | AI integration          | Gemini API communication, prompt management    |
| **Profile Generator**    | Report formatting       | Slack Block Kit formatting, privacy compliance |
| **SSO Handler**          | Authentication          | Google OAuth2 flow, JWT management             |
| **Auth Middleware**      | Route protection        | JWT verification, access control               |
| **Rate Limiter**         | Performance control     | Request throttling, abuse prevention           |
| **Error Handler**        | Error management        | Graceful failure handling, logging             |
| **Logger**               | Monitoring              | Structured logging, performance tracking       |

## API Reference

### Slack Commands

#### `/suggest [your question]`

Get Gemini-powered response suggestions for your question in the current channel context.

#### `/personality-analyze`

Analyze the personality profiles of conversation participants.

#### `/config`, `/config-method`, `/config-reset`, `/config-methods`

Configure analysis methods and preferences.

### @mention Activation

Mention the bot in any channel with a question to get Gemini-powered suggestions.

### Authentication Endpoints

#### `GET /auth/google`

Initiates Google OAuth2 authentication flow.

#### `GET /auth/google/callback`

Handles OAuth2 callback and creates user session.

#### `GET /auth/logout`

Logs out the current user and clears session.

#### `GET /auth/protected`

Protected endpoint requiring authentication.

## Environment Variables

### Required Variables

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here

# Google Gemini Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### Optional Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Analysis Configuration
MAX_CONTEXT_MESSAGES=1000
MAX_CONTEXT_DAYS=30
CACHE_TTL_MS=300000
```

## Security Features

- **Data Sanitization**: All messages are sanitized to remove sensitive information
- **Privacy Compliance**: Analysis results and suggestions are sent as ephemeral messages
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Graceful error handling without exposing sensitive data

## Monitoring and Logging

The bot includes comprehensive logging and monitoring:

- **Structured Logging**: JSON-formatted logs with contextual information
- **Performance Tracking**: Duration measurements for all operations
- **Error Monitoring**: Detailed error logging with stack traces
- **Usage Analytics**: Track command usage and success rates
- **Health Checks**: Built-in health check endpoints

## Troubleshooting

### Common Issues

1. **Bot not responding to commands or mentions**

   - Check if bot token is valid
   - Verify bot is added to the channel
   - Check bot permissions (commands, chat:write)

2. **Gemini API errors**

   - Verify API key is correct
   - Check API quota and billing
   - Ensure model name is valid

3. **SSO authentication issues**

   - Verify Google OAuth2 credentials
   - Check redirect URI configuration
   - Ensure JWT secret is set

4. **Rate limiting issues**
   - Check Slack API rate limits
   - Verify Gemini API rate limits
   - Adjust rate limiting configuration

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Test the health check endpoints
4. Contact the development team with specific error details
