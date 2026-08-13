import fs from 'fs';
import pathLib from 'path';

// Create logs directory if it doesn't exist
const logsDir = pathLib.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get current date in YYYY-MM-DD format
const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Get current timestamp
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString();
};

// Helper to get log file path
const getLogPath = (type: string): string => {
  return pathLib.join(logsDir, `${type}-${getCurrentDate()}.log`);
};

/**
 * Logger utility for application logging
 */
export const logger = {
  /**
   * Log error messages
   */
  error: (message: string, error?: any, context?: string): void => {
    const timestamp = getTimestamp();
    const errorLogPath = getLogPath('error');
    const logEntry = `[${timestamp}] ${context ? `[${context}]` : ''} ERROR: ${message}\n${error ? `Details: ${JSON.stringify(error, null, 2)}\n` : ''}---\n`;
    
    // Write to error log file
    fs.appendFileSync(errorLogPath, logEntry, 'utf8');
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ [${context || 'APP'}] ${message}`, error);
    }
  },

  /**
   * Log info messages
   */
  info: (message: string, data?: any, context?: string): void => {
    const timestamp = getTimestamp();
    const infoLogPath = getLogPath('info');
    const logEntry = `[${timestamp}] ${context ? `[${context}]` : ''} INFO: ${message}\n${data ? `Data: ${JSON.stringify(data, null, 2)}\n` : ''}---\n`;
    
    // Write to info log file
    fs.appendFileSync(infoLogPath, logEntry, 'utf8');
    
    // Also log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`ℹ️  [${context || 'APP'}] ${message}`, data);
    }
  },

  /**
   * Log debug messages
   */
  debug: (message: string, data?: any, context?: string): void => {
    // Only log debug in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const timestamp = getTimestamp();
    const debugLogPath = getLogPath('debug');
    const logEntry = `[${timestamp}] ${context ? `[${context}]` : ''} DEBUG: ${message}\n${data ? `Data: ${JSON.stringify(data, null, 2)}\n` : ''}---\n`;
    
    // Write to debug log file
    fs.appendFileSync(debugLogPath, logEntry, 'utf8');
    
    // Log to console
    console.debug(`🐛 [${context || 'APP'}] ${message}`, data);
  },

  /**
   * Log warning messages
   */
  warn: (message: string, data?: any, context?: string): void => {
    const timestamp = getTimestamp();
    const warningLogPath = getLogPath('warning');
    const logEntry = `[${timestamp}] ${context ? `[${context}]` : ''} WARNING: ${message}\n${data ? `Data: ${JSON.stringify(data, null, 2)}\n` : ''}---\n`;
    
    // Write to warning log file
    fs.appendFileSync(warningLogPath, logEntry, 'utf8');
    
    // Log to console
    console.warn(`⚠️  [${context || 'APP'}] ${message}`, data);
  },

  /**
   * Log HTTP requests
   */
  request: (method: string, pathStr: string, statusCode: number, duration: number, userId?: number): void => {
    const timestamp = getTimestamp();
    const requestLogPath = getLogPath('request');
    const logEntry = `[${timestamp}] ${method} ${pathStr} - Status: ${statusCode} - Duration: ${duration}ms${userId ? ` - User: ${userId}` : ''}\n`;
    
    // Write to request log file
    fs.appendFileSync(requestLogPath, logEntry, 'utf8');
  },

  /**
   * Log database operations
   */
  db: (operation: string, table: string, duration: number, success: boolean, error?: string): void => {
    const timestamp = getTimestamp();
    const dbLogPath = getLogPath('database');
    const logEntry = `[${timestamp}] ${operation.toUpperCase()} on ${table} - ${success ? 'Success' : 'Failed'} - Duration: ${duration}ms${error ? ` - Error: ${error}` : ''}\n`;
    
    // Write to database log file
    fs.appendFileSync(dbLogPath, logEntry, 'utf8');
  },

  /**
   * Get all log files info
   */
  getLogFiles: (): string[] => {
    if (fs.existsSync(logsDir)) {
      return fs.readdirSync(logsDir);
    }
    return [];
  },

  /**
   * Read a specific log file
   */
  readLog: (filename: string): string => {
    const filePath = pathLib.join(logsDir, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return 'Log file not found';
  },

  /**
   * Clear old log files (older than X days)
   */
  clearOldLogs: (daysOld: number = 7): void => {
    if (!fs.existsSync(logsDir)) return;

    const files = fs.readdirSync(logsDir);
    const now = Date.now();
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    files.forEach((file) => {
      const filePath = pathLib.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const fileAgeInDays = (now - stats.mtime.getTime()) / millisecondsPerDay;

      if (fileAgeInDays > daysOld) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    });
  }
};
