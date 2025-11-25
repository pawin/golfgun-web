/**
 * Debug Logger - Stores logs in memory for display in UI
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  private addLog(level: LogLevel, source: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      source,
      message,
      data,
    };

    this.logs.unshift(entry); // Add to beginning
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();

    // Also log to console for backup
    const consoleMsg = `[${source}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMsg, data);
        break;
      case 'warn':
        console.warn(consoleMsg, data);
        break;
      case 'success':
        console.log(`✅ ${consoleMsg}`, data);
        break;
      default:
        console.log(consoleMsg, data);
    }
  }

  info(source: string, message: string, data?: any) {
    this.addLog('info', source, message, data);
  }

  warn(source: string, message: string, data?: any) {
    this.addLog('warn', source, message, data);
  }

  error(source: string, message: string, data?: any) {
    this.addLog('error', source, message, data);
  }

  success(source: string, message: string, data?: any) {
    this.addLog('success', source, message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.listeners.add(callback);
    // Immediately call with current logs
    callback(this.getLogs());
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const logs = this.getLogs();
    this.listeners.forEach(callback => callback(logs));
  }
}

// Singleton instance
export const debugLogger = new DebugLogger();

