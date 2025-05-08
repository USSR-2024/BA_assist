import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('validators');

/**
 * Типы правил валидации
 */
type ValidationRule = {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  errorMessage?: string;
};

/**
 * Функция для валидации запросов API
 * @param req Запрос Next.js
 * @param rules Массив правил валидации
 * @returns Результат валидации
 */
export async function validateRequest(
  req: NextRequest, 
  rules: ValidationRule[]
): Promise<{ success: boolean; data?: any; errors?: Record<string, string>; response?: NextResponse }> {
  try {
    let data: Record<string, any> = {};
    
    if (req.method === 'GET') {
      // Для GET-запросов обрабатываем query-параметры
      const url = new URL(req.url);
      data = Object.fromEntries(url.searchParams.entries());
    } else {
      // Для остальных запросов обрабатываем тело запроса
      try {
        data = await req.json();
      } catch (error) {
        logger.error('Ошибка парсинга JSON в запросе', error);
        return {
          success: false,
          response: NextResponse.json(
            { success: false, error: 'Неверный формат JSON в запросе' },
            { status: 400 }
          )
        };
      }
    }
    
    const errors: Record<string, string> = {};
    
    // Применяем все правила валидации
    for (const rule of rules) {
      const value = data[rule.field];
      
      // Проверка обязательных полей
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[rule.field] = rule.errorMessage || `Поле ${rule.field} обязательно`;
        continue;
      }
      
      if (value !== undefined && value !== null) {
        // Проверка минимальной длины
        if (rule.minLength && String(value).length < rule.minLength) {
          errors[rule.field] = rule.errorMessage || `Минимальная длина поля ${rule.field}: ${rule.minLength}`;
        }
        
        // Проверка максимальной длины
        if (rule.maxLength && String(value).length > rule.maxLength) {
          errors[rule.field] = rule.errorMessage || `Максимальная длина поля ${rule.field}: ${rule.maxLength}`;
        }
        
        // Проверка по регулярному выражению
        if (rule.pattern && !rule.pattern.test(String(value))) {
          errors[rule.field] = rule.errorMessage || `Поле ${rule.field} не соответствует формату`;
        }
        
        // Пользовательская проверка
        if (rule.custom && !rule.custom(value)) {
          errors[rule.field] = rule.errorMessage || `Поле ${rule.field} не прошло валидацию`;
        }
      }
    }
    
    // Если есть ошибки, возвращаем их
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        errors,
        response: NextResponse.json(
          { success: false, errors },
          { status: 400 }
        )
      };
    }
    
    // Если все проверки пройдены, возвращаем данные
    return { success: true, data };
  } catch (error) {
    logger.error('Ошибка при валидации запроса', error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Внутренняя ошибка сервера при валидации запроса' },
        { status: 500 }
      )
    };
  }
}

/**
 * Часто используемые регулярные выражения для валидации
 */
export const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  url: /^(https?:\/\/)?([\w\d]+\.)+[\w\d]{2,}(\/[\w\d\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
  phone: /^\+?[0-9]{10,15}$/,
};
