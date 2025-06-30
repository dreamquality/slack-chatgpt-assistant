# Local Testing Guide

This guide will help you set up and test the Slack Personality & Response Assistant Bot locally.

## 🚀 Quick Start

### 1. **Environment Setup**

1. Copy the example environment file:

   ```bash
   cp env.local.example .env
   ```

2. Edit `.env` and add your credentials:

   ```bash
   # Slack Configuration
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_SIGNING_SECRET=your-signing-secret-here
   SLACK_APP_TOKEN=xapp-your-app-token-here

   # Google Gemini Configuration
   GEMINI_API_KEY=your-gemini-api-key-here
   GEMINI_MODEL=gemini-2.0-flash-exp
   GEMINI_MAX_TOKENS=2000
   GEMINI_TEMPERATURE=0.7

   # Google OAuth2 Configuration
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

   # JWT Configuration
   JWT_SECRET=your-jwt-secret-key-here
   JWT_EXPIRES_IN=24h

   # Application Configuration
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=debug

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=10
   ```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Build the Project**

```bash
npm run build
```

### 4. **Start the Bot**

```bash
npm start
```

The bot will start on `http://localhost:3000`

## 🔧 Google Cloud Setup

### 1. **Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Slack Personality Bot")
4. Click "Create"

### 2. **Enable Gemini API**

1. In your Google Cloud project, go to "APIs & Services" → "Library"
2. Search for "Gemini API"
3. Click on "Gemini API" and click "Enable"
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "API Key"
6. Copy the API key and add it to your `.env` file as `GEMINI_API_KEY`

### 3. **Set up Google OAuth2**

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:

   - User Type: External
   - App name: "Slack Personality Bot"
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the remaining steps

4. Create OAuth 2.0 Client ID:

   - Application type: Web application
   - Name: "Slack Personality Bot Local"
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Click "Create"

5. Copy the Client ID and Client Secret to your `.env` file:
   - `GOOGLE_CLIENT_ID=your-client-id`
   - `GOOGLE_CLIENT_SECRET=your-client-secret`

### 4. **Generate JWT Secret**

Generate a secure JWT secret:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64
```

Add the generated secret to your `.env` file as `JWT_SECRET`.

## 🔧 Slack App Setup

### 1. **Create a Slack App**

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "Personality Analysis Bot")
4. Select your workspace

### 2. **Configure OAuth & Permissions**

1. Go to "OAuth & Permissions"
2. Add these Bot Token Scopes:

   - `app_mentions:read`
   - `channels:history`
   - `chat:write`
   - `commands`
   - `groups:history`
   - `im:history`
   - `mpim:history`
   - `users:read`

3. Install the app to your workspace
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 3. **Configure Event Subscriptions**

1. Go to "Event Subscriptions"
2. Enable events
3. Set Request URL to: `https://your-ngrok-url.ngrok.io/slack/events`
4. Subscribe to bot events:
   - `app_mention`
   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`

### 4. **Configure Slash Commands**

1. Go to "Slash Commands"
2. Create these commands:
   - `/personality-analyze` - Analyze conversation participants' personalities
   - `/config` - Show current configuration
   - `/config-method` - Change analysis method
   - `/config-reset` - Reset to defaults
   - `/config-methods` - Show available methods

### 5. **Get App Credentials**

1. **Signing Secret**: Go to "Basic Information" → "App Credentials"
2. **App Token**: Go to "Basic Information" → "App-Level Tokens" → Create new token with `connections:write` scope

## 🌐 Expose Your Local Server

### Using ngrok (Recommended)

1. Install ngrok: `npm install -g ngrok`
2. Start your bot: `npm start`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update your Slack app's Request URL to: `https://abc123.ngrok.io/slack/events`

### Using localtunnel

```bash
npm install -g localtunnel
npm start
# In another terminal:
lt --port 3000
```

## 🧪 Testing the Bot

### 1. **Add Bot to Channel**

1. Invite the bot to a channel: `/invite @YourBotName`
2. The bot should respond to commands and @mentions

### 2. **Test Gemini-Powered Response Suggestions**

#### **@mention Activation**

1. In any channel with the bot, mention it with a question:
   ```
   @YourBotName How should I respond to this client?
   ```
2. The bot will analyze the conversation and provide several Gemini-powered response suggestions as an ephemeral message.

#### **/suggest Command**

1. In any channel with the bot, type:
   ```
   /suggest How should I respond to this client?
   ```
2. The bot will analyze the recent conversation and provide suggestions.

### 3. **Test Personality Analysis Command**

1. In any channel with the bot and multiple participants, type:
   ```
   /personality-analyze
   ```
2. The bot will analyze the conversation history and generate personality profiles for each participant.

### 4. **Test Google SSO Authentication**

1. Visit `http://localhost:3000/auth/google` in your browser
2. Complete the Google OAuth2 flow
3. You should be redirected back with a success message
4. Test protected endpoints: `http://localhost:3000/auth/protected`

### 5. **Test Configuration Commands**

1. `/config` - Should show your current settings
2. `/config-methods` - Should list available analysis methods
3. `/config-method recent_messages` - Should update your method
4. `/config-reset` - Should reset to defaults

### 6. **Test Context Analysis**

1. Have a conversation in a channel with multiple participants
2. Use the `/personality-analyze` command
3. The bot should analyze the conversation context and provide personality profiles

## 🔍 Debugging

### 1. **Check Logs**

The bot uses structured logging. Check the console for:

- `[INFO]` - General information
- `[DEBUG]` - Detailed debugging info
- `[WARN]` - Warnings
- `[ERROR]` - Errors

### 2. **Health Checks**

Test the health endpoints:

- `http://localhost:3000/health` - Basic health status
- `http://localhost:3000/status` - Detailed status with memory usage

### 3. **Common Issues**

**Bot not responding:**

- Check if bot token is correct
- Verify bot is added to the channel
- Check ngrok URL is updated in Slack app

**Gemini API errors:**

- Verify API key is correct
- Check API quota and billing
- Ensure model name is valid
- Verify Gemini API is enabled in Google Cloud

**Google SSO errors:**

- Verify OAuth2 credentials are correct
- Check redirect URI matches exactly
- Ensure JWT secret is set
- Verify OAuth consent screen is configured

**Configuration issues:**

- Check data directory permissions
- Verify environment variables are set

### 4. **Environment Variables**

Make sure all required variables are set:

```bash
echo $SLACK_BOT_TOKEN
echo $GEMINI_API_KEY
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $JWT_SECRET
echo $SLACK_SIGNING_SECRET
echo $SLACK_APP_TOKEN
```

### 5. **Google Cloud Troubleshooting**

**API Key Issues:**

- Ensure the API key has access to Gemini API
- Check if billing is enabled for the project
- Verify the API key is not restricted to specific IPs

**OAuth2 Issues:**

- Ensure the redirect URI exactly matches: `http://localhost:3000/auth/google/callback`
- Check that the OAuth consent screen is published
- Verify the client ID and secret are correct

### 6. **Slack Troubleshooting**

**Command Not Working:**

- Ensure the command is properly configured in Slack app
- Check bot permissions include `commands` scope
- Verify the bot is installed to the workspace

**Events Not Receiving:**

- Check the Request URL is correct and accessible
- Verify event subscriptions are enabled
- Ensure the bot has the required scopes

## 🧪 Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- --testPathPatterns="personalityAnalyzer.test.ts"
npm test -- --testPathPatterns="personalityHandler.test.ts"

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Run integration tests
npm test -- --testPathPatterns="integration.test.ts"
```

### Debug Tests

```bash
# Run tests with debug logging
LOG_LEVEL=debug npm test
```

## 📝 Development Workflow

### 1. **Making Changes**

1. Make your changes in the source code
2. Run tests to ensure nothing is broken
3. Test locally with the bot
4. Commit your changes

### 2. **Testing New Features**

1. Add unit tests for new functionality
2. Test the feature manually in Slack
3. Verify logging and error handling
4. Update documentation if needed

### 3. **Debugging Issues**

1. Enable debug logging: `LOG_LEVEL=debug`
2. Check the console for detailed logs
3. Use the health check endpoints
4. Verify all environment variables are set

## 🚀 Next Steps

Once local testing is working:

1. Deploy to a staging environment
2. Test with real Slack workspace
3. Configure production environment variables
4. Set up monitoring and logging
5. Deploy to production

## 📞 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Test the health endpoints
4. Review the deployment documentation
