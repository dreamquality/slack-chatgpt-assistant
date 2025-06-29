"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.level = this.getLogLevel();
    }
    getLogLevel() {
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
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }
    error(message, context) {
        if (this.level >= LogLevel.ERROR) {
            console.error(this.formatMessage("ERROR", message, context));
        }
    }
    warn(message, context) {
        if (this.level >= LogLevel.WARN) {
            console.warn(this.formatMessage("WARN", message, context));
        }
    }
    info(message, context) {
        if (this.level >= LogLevel.INFO) {
            console.info(this.formatMessage("INFO", message, context));
        }
    }
    debug(message, context) {
        if (this.level >= LogLevel.DEBUG) {
            console.debug(this.formatMessage("DEBUG", message, context));
        }
    }
    time(label) {
        if (this.level >= LogLevel.DEBUG) {
            console.time(label);
        }
    }
    timeEnd(label) {
        if (this.level >= LogLevel.DEBUG) {
            console.timeEnd(label);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map