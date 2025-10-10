import fs from 'fs';
import path from 'path';

const logsDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    const logWithMeta = meta 
      ? `${logMessage} ${JSON.stringify(meta)}` 
      : logMessage;
    
    // Console
    console.log(logWithMeta);
    
    // File
    const logFile = path.join(logsDir, `${level}.log`);
    fs.appendFileSync(logFile, logWithMeta + '\n');
  }
  
  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }
  
  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }
  
  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }
  
  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }
}

export default new Logger();