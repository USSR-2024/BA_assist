import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Интерфейс результата авторизации
interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

// Ключ для проверки JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Промежуточное ПО для проверки авторизации в API-запросах
 * @param req Запрос Next.js
 * @returns Результат авторизации (успех/неудача, ID пользователя, ошибка)
 */
export async function authMiddleware(req: NextRequest): Promise<AuthResult> {
  try {
    // Получаем токен из cookie
    const token = req.cookies.get('token')?.value;
    
    // Если токен отсутствует, возвращаем ошибку
    if (!token) {
      return {
        success: false,
        error: 'Требуется авторизация'
      };
    }
    
    try {
      // Проверяем токен
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
      };
      
      // Если токен прошел проверку, возвращаем успех и ID пользователя
      return {
        success: true,
        userId: decoded.userId
      };
    } catch (jwtError) {
      // Ошибка проверки токена (истек срок, подделка и т.д.)
      console.error('Ошибка проверки JWT:', jwtError);
      
      return {
        success: false,
        error: 'Недействительный токен авторизации'
      };
    }
  } catch (error) {
    // Непредвиденная ошибка
    console.error('Ошибка авторизации:', error);
    
    return {
      success: false,
      error: 'Ошибка сервера при авторизации'
    };
  }
}