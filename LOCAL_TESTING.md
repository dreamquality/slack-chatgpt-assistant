# Local Testing Guide

This guide will help you set up and test the Slack ChatGPT Assistant Bot locally.

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

   # OpenAI Configuration
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4
   OPENAI_MAX_TOKENS=2000
   OPENAI_TEMPERATURE=0.7

   # Application Configuration
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=debug
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

## 🔧 Slack App Setup

### 1. **Create a Slack App**

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "ChatGPT Assistant")
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
2. The bot should respond to mentions

### 2. **Test Bot Mentions**

1. In any channel with the bot, mention it:
   ```
   @YourBotName help me with this conversation
   ```
2. The bot should respond with an ephemeral message

### 3. **Test Configuration Commands**

1. `/config` - Should show your current settings
2. `/config-methods` - Should list available analysis methods
3. `/config-method recent_messages` - Should update your method
4. `/config-reset` - Should reset to defaults

### 4. **Test Context Analysis**

1. Have a conversation in a channel
2. Mention the bot with a question
3. The bot should analyze the conversation context and provide suggestions

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

**OpenAI errors:**

- Verify API key is correct
- Check API quota and billing
- Ensure model name is valid

**Configuration issues:**

- Check data directory permissions
- Verify environment variables are set

### 4. **Environment Variables**

Make sure all required variables are set:

```bash
echo $SLACK_BOT_TOKEN
echo $OPENAI_API_KEY
echo $SLACK_SIGNING_SECRET
echo $SLACK_APP_TOKEN
```

## 🐳 Docker Testing

### 1. **Build Docker Image**

```bash
docker build -t slack-chatgpt-bot .
```

### 2. **Run with Docker**

```bash
docker run -d \
  --name slack-bot \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  slack-chatgpt-bot
```

### 3. **Run with Docker Compose**

```bash
docker-compose up -d
```

## 📝 Testing Checklist

- [ ] Bot responds to mentions
- [ ] Responses are ephemeral (private)
- [ ] Configuration commands work
- [ ] Context analysis provides relevant suggestions
- [ ] Error handling works (try invalid commands)
- [ ] Rate limiting works (spam mentions)
- [ ] Health endpoints respond
- [ ] Logs show appropriate information

## 🚨 Troubleshooting

### Bot Not Starting

```bash
# Check if port is in use
lsof -i :3000

# Check environment variables
node -e "console.log(process.env.SLACK_BOT_TOKEN ? 'Token set' : 'Token missing')"
```

### Slack Events Not Working

1. Verify Request URL in Slack app settings
2. Check ngrok is running and URL is correct
3. Ensure all required scopes are added
4. Check bot is installed to workspace

### OpenAI API Issues

1. Verify API key is valid
2. Check account has credits
3. Ensure model name is correct
4. Check rate limits

## 🎯 Next Steps

Once local testing is working:

1. **Deploy to staging** using the deployment guide
2. **Set up monitoring** and logging
3. **Configure production** environment variables
4. **Test with real users** in your workspace

## 📞 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Test the health endpoints
4. Review the deployment documentation
