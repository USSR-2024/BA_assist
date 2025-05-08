/**
 * Стандартизированный доступ к переменным окружения с значениями по умолчанию
 */
export const ENV = {
  // Основные настройки
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // База данных
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/baassist',
  
  // Google Cloud Storage
  GCS_PROJECT_ID: process.env.GCS_PROJECT_ID || 'ba-assistant-project',
  GCS_BUCKET: process.env.GCS_BUCKET || 'baassist-files',
  GCS_KEY_FILE: process.env.GCS_KEY_FILE || 'keys/gcs-service-account.json',
  USE_REAL_GCS: process.env.USE_REAL_GCS === 'true',
  
  // Сервис парсера
  PARSER_URL: process.env.PARSER_URL || 'http://localhost:4000/extract-text',
  
  // Настройки электронной почты
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@baassist.com',
  
  // OpenAI API
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  
  // Возвращает, правильно ли настроена отправка email
  get emailConfigured(): boolean {
    return !!(this.SMTP_HOST && this.SMTP_USER && this.SMTP_PASS);
  },
  
  // Возвращает, правильно ли настроена интеграция с OpenAI
  get openaiConfigured(): boolean {
    return !!this.OPENAI_API_KEY;
  }
};