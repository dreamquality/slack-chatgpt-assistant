export interface ErrorContext {
  userId?: string;
  channelId?: string;
  action?: string;
  timestamp: number;
}

export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: ErrorContext,
    public originalError?: Error
  ) {
    super(message);
    this.name = "BotError";
  }
}

export function handleSlackError(error: any, context?: ErrorContext): BotError {
  if (error.code === "token_revoked") {
    return new BotError(
      "Bot token has been revoked",
      "TOKEN_REVOKED",
      context,
      error
    );
  }

  if (error.code === "channel_not_found") {
    return new BotError(
      "Channel not found or bot not in channel",
      "CHANNEL_NOT_FOUND",
      context,
      error
    );
  }

  if (error.code === "missing_scope") {
    return new BotError(
      "Bot missing required permissions",
      "MISSING_SCOPE",
      context,
      error
    );
  }

  if (error.code === "rate_limited") {
    return new BotError(
      "Rate limited by Slack API",
      "RATE_LIMITED",
      context,
      error
    );
  }

  return new BotError(
    "Slack API error occurred",
    "SLACK_API_ERROR",
    context,
    error
  );
}

export function handleOpenAIError(
  error: any,
  context?: ErrorContext
): BotError {
  if (error.status === 429) {
    return new BotError(
      "OpenAI rate limit exceeded",
      "OPENAI_RATE_LIMIT",
      context,
      error
    );
  }

  if (error.status === 401) {
    return new BotError(
      "OpenAI authentication failed",
      "OPENAI_AUTH_ERROR",
      context,
      error
    );
  }

  if (error.status === 503) {
    return new BotError(
      "OpenAI service unavailable",
      "OPENAI_SERVICE_UNAVAILABLE",
      context,
      error
    );
  }

  return new BotError(
    "OpenAI API error occurred",
    "OPENAI_API_ERROR",
    context,
    error
  );
}

export function handleConfigError(
  error: any,
  context?: ErrorContext
): BotError {
  if (error.code === "ENOENT") {
    return new BotError(
      "Configuration file not found",
      "CONFIG_FILE_NOT_FOUND",
      context,
      error
    );
  }

  if (error instanceof SyntaxError) {
    return new BotError(
      "Invalid configuration format",
      "CONFIG_INVALID_FORMAT",
      context,
      error
    );
  }

  return new BotError(
    "Configuration error occurred",
    "CONFIG_ERROR",
    context,
    error
  );
}

export function logError(error: BotError): void {
  console.error(`[${error.code}] ${error.message}`, {
    context: error.context,
    originalError: error.originalError?.message,
    stack: error.stack,
  });
}
