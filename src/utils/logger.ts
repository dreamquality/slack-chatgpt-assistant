export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  userId?: string;
  channelId?: string;
  action?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case "error":
        return LogLevel.ERROR;
      case "warn":
        return LogLevel.WARN;
      case "info":
        return LogLevel.INFO;
      case "debug":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  error(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage("ERROR", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage("WARN", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.INFO) {
      console.info(this.formatMessage("INFO", message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(this.formatMessage("DEBUG", message, context));
    }
  }

  // Performance tracking
  time(label: string): void {
    if (this.level >= LogLevel.DEBUG) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.level >= LogLevel.DEBUG) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();
