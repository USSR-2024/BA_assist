/**
 * Система логирования для приложения
 */

enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

class Logger {
  private context: string;
  private isDevelopment: boolean;
  
  constructor(context: string) {
    this.context = context;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }
  
  /**
   * Запись отладочного сообщения (только в режиме разработки)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }
  
  /**
   * Запись информационного сообщения
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * Запись предупреждения
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * Запись сообщения об ошибке
   */
  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
    
    // В продакшене можно отправлять ошибки в сервис мониторинга
    if (!this.isDevelopment) {
      // Например: sendToMonitoring(message, error);
    }
  }
  
  /**
   * Запись сообщения в лог
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data ? { data: this.sanitizeData(data) } : {})
    };
    
    // Форматируем вывод в консоль
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, data ? this.sanitizeData(data) : '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data ? this.sanitizeData(data) : '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data ? this.sanitizeData(data) : '');
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data ? this.sanitizeData(data) : '');
        break;
    }
    
    // Здесь можно добавить запись в файл или отправку в сервис логирования
  }
  
  /**
   * Удаляем или маскируем конфиденциальные данные
   */
  private sanitizeData(data: any): any {
    if (data instanceof Error) {
      return {
        message: data.message,
        name: data.name,
        stack: data.stack
      };
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Маскируем чувствительные поля
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
      
      for (const field in sanitized) {
        if (sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive))) {
          sanitized[field] = '[REDACTED]';
        } else if (typeof sanitized[field] === 'object' && sanitized[field] !== null) {
          sanitized[field] = this.sanitizeData(sanitized[field]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
}

/**
 * Создаёт и возвращает новый экземпляр логгера для указанного контекста
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Экспортируем готовый логгер для общего пользования
export const logger = createLogger('app');
