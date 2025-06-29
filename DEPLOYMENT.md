# Deployment Guide

This guide covers deploying the Slack ChatGPT Assistant Bot to various cloud platforms.

## Prerequisites

- Node.js 18+ installed
- Docker (for containerized deployment)
- Slack App with appropriate permissions
- OpenAI API key

## Environment Variables

Create a `.env` file with the following variables:

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
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Context Analysis
MAX_CONTEXT_MESSAGES=100
MAX_CONTEXT_DAYS=30
CACHE_TTL_MS=300000
```

## Docker Deployment

### Local Development

```bash
# Build the image
docker build -t slack-chatgpt-bot .

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -d \
  --name slack-bot \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  slack-chatgpt-bot
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
docker build -t gcr.io/PROJECT_ID/slack-bot .
docker push gcr.io/PROJECT_ID/slack-bot

# Deploy to Cloud Run
gcloud run deploy slack-bot \
  --image gcr.io/PROJECT_ID/slack-bot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### Heroku

```bash
# Create Heroku app
heroku create your-slack-bot

# Set environment variables
heroku config:set SLACK_BOT_TOKEN=xoxb-your-token
heroku config:set SLACK_SIGNING_SECRET=your-secret
heroku config:set SLACK_APP_TOKEN=xapp-your-token
heroku config:set OPENAI_API_KEY=sk-your-key
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

1. **Bot not responding to mentions**

   - Check if bot token is valid
   - Verify bot is added to the channel
   - Check bot permissions (app_mentions:read, chat:write)

2. **OpenAI API errors**

   - Verify API key is correct
   - Check API quota and billing
   - Ensure model name is valid

3. **Rate limiting issues**

   - Check Slack API rate limits
   - Verify OpenAI API rate limits
   - Adjust rate limiting configuration

4. **Configuration not persisting**
   - Check data directory permissions
   - Verify file system is writable
   - Check disk space

### Logs

Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables.

### Monitoring

Monitor the following metrics:

- Response time for mentions
- OpenAI API usage and costs
- Error rates
- Memory usage
- Uptime

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Keys**: Rotate API keys regularly
3. **Network Security**: Use HTTPS in production
4. **Access Control**: Limit bot access to necessary channels only
5. **Data Privacy**: Ensure conversation data is handled according to privacy policies

## Scaling

For high-traffic scenarios:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Caching**: Implement Redis for shared caching
3. **Database**: Use a proper database instead of file storage
4. **Monitoring**: Set up comprehensive monitoring and alerting

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Test the health check endpoints
4. Contact the development team with specific error details
