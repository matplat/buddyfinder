/**
 * Simple logger utility for development and testing
 * Provides structured logging with context and timestamps
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

export class Logger {
  constructor(private readonly context: string) {}

  /**
   * Formats and outputs a log entry to console
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data: data ? this.sanitize(data) : undefined,
    };

    // Format output for better readability
    const prefix = `[${entry.timestamp}] ${entry.level} [${entry.context}]`;

    switch (level) {
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(prefix, message, data ? this.sanitize(data) : "");
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(prefix, message, data ? this.sanitize(data) : "");
        break;
      case LogLevel.DEBUG:
        // Only log debug in development
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.debug(prefix, message, data ? this.sanitize(data) : "");
        }
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(prefix, message, data ? this.sanitize(data) : "");
    }
  }

  /**
   * Sanitizes sensitive data before logging
   * Removes or masks fields that should not be logged
   */
  private sanitize(data: unknown): unknown {
    if (!data) return data;

    // Handle Error objects
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: process.env.NODE_ENV === "development" ? data.stack : undefined,
      };
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    // Handle objects
    if (typeof data === "object") {
      const sanitized: Record<string, unknown> = {};
      const sensitiveFields = [
        "password",
        "token",
        "jwt",
        "secret",
        "authorization",
        "cookie",
        "session",
        "access_token",
        "refresh_token",
      ];

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // Mask sensitive fields
        if (sensitiveFields.some((field) => lowerKey.includes(field))) {
          sanitized[key] = "***REDACTED***";
        }
        // Recursively sanitize nested objects
        else if (typeof value === "object" && value !== null) {
          sanitized[key] = this.sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Logs informational messages
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Logs warning messages
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Logs error messages
   */
  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Logs debug messages (only in development)
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }
}

/**
 * Creates a logger instance with the given context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}
