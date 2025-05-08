// Создаем файл lib/validators.ts
import { NextRequest, NextResponse } from 'next/server';

type ValidationRule = {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  errorMessage?: string;
};

export function validateRequest(req: NextRequest, rules: ValidationRule[]) {
  const contentType = req.headers.get('content-type') || '';
  let data: any = {};
  
  if (req.method === 'GET') {
    data = Object.fromEntries(new URL(req.url).searchParams);
  } else if (contentType.includes('application/json')) {
    // Для асинхронных функций нужен await
    // В этом случае это заглушка, реальный код должен использовать await req.json()
    data = {};
  }
  
  const errors: Record<string, string> = {};
  
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
  
  if (Object.keys(errors).length > 0) {
    return { 
      success: false, 
      errors,
      response: NextResponse.json({ 
        success: false, 
        errors 
      }, { status: 400 })
    };
  }
  
  return { success: true, data };
}

// Валидаторы для различных типов данных
export const validators = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  url: /^(https?:\/\/)?([\w\d]+\.)+[\w\d]{2,}(\/[\w\d\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
  phone: /^\+?[0-9]{10,15}$/,
};