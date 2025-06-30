# Deployment Guide

This guide covers deploying the Slack Personality & Response Assistant Bot to various cloud platforms.

## Prerequisites

- Node.js 18+ installed
- Docker (for containerized deployment)
- Slack App with appropriate permissions
- Google Cloud Project with Gemini API enabled
- Google OAuth2 credentials for SSO

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here

# Google Gemini Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Context Analysis
MAX_CONTEXT_MESSAGES=1000
MAX_CONTEXT_DAYS=30
CACHE_TTL_MS=300000
```

## Google Cloud Setup

### 1. Enable Gemini API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Library"
4. Search for "Gemini API"
5. Click "Enable"
6. Go to "APIs & Services" → "Credentials"
7. Click "Create Credentials" → "API Key"
8. Copy the API key and add it to your `.env` file as `GEMINI_API_KEY`

### 2. Set up Google OAuth2

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen:
   - User Type: External
   - App name: "Slack Personality Bot"
   - User support email: Your email
   - Developer contact information: Your email
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: "Slack Personality Bot"
   - Authorized redirect URIs: `https://your-domain.com/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### 3. Generate JWT Secret

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Docker Deployment

### Local Development

```bash
# Build the image
docker build -t slack-personality-bot .

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -d \
  --name slack-bot \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  slack-personality-bot
```

### Cloud Deployment

#### AWS ECS

1. Create an ECS cluster
2. Create a task definition with the Docker image
3. Set environment variables in the task definition
4. Create a service to run the task

#### Google Cloud Run

```bash
# Build and push to Google Container Registry
docker build -t gcr.io/PROJECT_ID/slack-personality-bot .
docker push gcr.io/PROJECT_ID/slack-personality-bot

# Deploy to Cloud Run
gcloud run deploy slack-personality-bot \
  --image gcr.io/PROJECT_ID/slack-personality-bot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### Heroku

```bash
# Create Heroku app
heroku create your-slack-personality-bot

# Set environment variables
heroku config:set SLACK_BOT_TOKEN=xoxb-your-token
heroku config:set SLACK_SIGNING_SECRET=your-secret
heroku config:set SLACK_APP_TOKEN=xapp-your-token
heroku config:set GEMINI_API_KEY=your-gemini-key
heroku config:set GOOGLE_CLIENT_ID=your-google-client-id
heroku config:set GOOGLE_CLIENT_SECRET=your-google-client-secret
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## Health Checks

The bot provides health check endpoints:

- `GET /health` - Basic health status
- `GET /status` - Detailed status with memory usage

## Troubleshooting

### Common Issues

1. **Bot not responding to mentions or commands**

   - Check if bot token is valid
   - Verify bot is added to the channel
   - Check bot permissions (app_mentions:read, chat:write, commands)

2. **Gemini API errors**

   - Verify API key is correct
   - Check API quota and billing
   - Ensure model name is valid
   - Verify Gemini API is enabled in Google Cloud

3. **Google SSO authentication issues**

   - Verify Google OAuth2 credentials are correct
   - Check redirect URI matches exactly (including protocol and port)
   - Ensure JWT secret is set and secure
   - Verify OAuth consent screen is configured
   - Check if the app is in testing mode (external users need to be added)

4. **Rate limiting issues**

   - Check Slack API rate limits
   - Verify Gemini API rate limits
   - Adjust rate limiting configuration

5. **Configuration not persisting**
   - Check data directory permissions
   - Verify file system is writable
   - Check disk space

### SSO-Specific Issues

1. **"Invalid redirect URI" error**

   - Ensure the redirect URI in Google Cloud Console exactly matches your deployment URL
   - For local development: `http://localhost:3000/auth/google/callback`
   - For production: `https://your-domain.com/auth/google/callback`

2. **"Access blocked" error**

   - Add your domain to authorized domains in Google Cloud Console
   - Add test users if your app is in testing mode
   - Verify OAuth consent screen is properly configured

3. **JWT token errors**
   - Ensure JWT_SECRET is set and consistent across deployments
   - Check JWT token expiration settings
   - Verify JWT token format and signature

### Gemini-Specific Issues

1. **"API key not found" error**

   - Verify GEMINI_API_KEY is set correctly
   - Check if the API key has access to Gemini API
   - Ensure the API key is not restricted by IP or referrer

2. **"Model not found" error**

   - Verify GEMINI_MODEL is set to a valid model name
   - Check if the model is available in your region
   - Ensure you have access to the specified model

3. **"Rate limit exceeded" error**
   - Implement exponential backoff in your application
   - Check your Gemini API quota and billing
   - Consider upgrading your API tier if needed

### Logs

Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables.

### Monitoring

Monitor the following metrics:

- Response time for mentions and commands
- Gemini API usage and costs
- SSO authentication success/failure rates
- Error rates
- Memory usage
- Uptime

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Keys**: Rotate API keys regularly
3. **JWT Secrets**: Use strong, randomly generated JWT secrets
4. **Network Security**: Use HTTPS in production
5. **Access Control**: Limit bot access to necessary channels only
6. **Data Privacy**: Ensure conversation data is handled according to privacy policies
7. **OAuth2 Security**: Use secure redirect URIs and validate state parameters

## Scaling

For high-traffic scenarios:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Caching**: Implement Redis for shared caching
3. **Database**: Use a proper database instead of file storage
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Rate Limiting**: Implement proper rate limiting for both Slack and Gemini APIs

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Test the health check endpoints
4. Check Google Cloud Console for API usage and errors
5. Contact the development team with specific error details
