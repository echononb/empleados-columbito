type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user ID from Firebase Auth or local storage
      const userData = localStorage.getItem('firebase:authUser');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.uid;
      }
    } catch (error) {
      // Ignore errors when getting user ID
    }
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry = this.createLogEntry(level, message, data);

    // Store log entry
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output (only in development or for errors/warnings)
    if (this.isDevelopment || level === 'error' || level === 'warn') {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');
    }

    // Send critical errors to external service in production
    if (level === 'error' && !this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // Here you could integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just store in localStorage for inspection
    try {
      const errorLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      errorLogs.push(entry);
      // Keep only last 50 errors
      if (errorLogs.length > 50) {
        errorLogs.splice(0, errorLogs.length - 50);
      }
      localStorage.setItem('error_logs', JSON.stringify(errorLogs));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  // Get logs for debugging (development only)
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Get error statistics
  getErrorStats(): { totalErrors: number; recentErrors: LogEntry[] } {
    const errors = this.logs.filter(log => log.level === 'error');
    const recentErrors = errors.slice(-10); // Last 10 errors
    return {
      totalErrors: errors.length,
      recentErrors
    };
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions for common logging patterns
export const logError = (error: Error, context?: string): void => {
  logger.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`, {
    stack: error.stack,
    name: error.name
  });
};

export const logAuthEvent = (event: string, data?: any): void => {
  logger.info(`Auth event: ${event}`, data);
};

export const logPerformance = (operation: string, duration: number, data?: any): void => {
  logger.debug(`Performance: ${operation} took ${duration}ms`, data);
};

export default logger;