export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LogLevel[level as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.getLogLevel();
  }

  private format(level: string, message: string, data?: any): string {
    const ts = new Date().toISOString();
    const payload = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${ts}] [${level}] ${message}${payload}`;
  }

  // ===== CORE LOG =====
  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.format('ERROR', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format('WARN', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format('INFO', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format('DEBUG', message, data));
    }
  }

  verbose(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(this.format('VERBOSE', message, data));
    }
  }

  success(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format('SUCCESS', message, data));
    }
  }

  // ===== API LOG =====
  apiRequest(method: string, url: string, headers?: any, body?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format('API_REQ', `${method} ${url}`, { headers, body }));
    }
  }

  apiResponse(status: number, url: string, body?: any): void {
    const level = status >= 200 && status < 300 ? 'API_OK' : 'API_FAIL';
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format(level, `${status} ${url}`, body));
    }
  }

  // ===== TEST LOG =====
  testStart(name: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format('TEST_START', name));
    }
  }

  testEnd(name: string, passed: boolean): void {
    const level = passed ? 'TEST_PASS' : 'TEST_FAIL';
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format(level, name));
    }
  }
}

export const logger = Logger.getInstance();