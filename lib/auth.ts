import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Интерфейс результата авторизации
export interface AuthResult {
  success: boolean;
  userId?: string;
  role?: string;
  error?: string;
}

// Ключ для проверки JWT - ОБЯЗАТЕЛЬНО должен быть задан в .env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET не найден в переменных окружения. Это критично для безопасности приложения!');
  // В продакшене нужно завершить процесс, но в разработке мы просто выведем сообщение
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

/**
 * Промежуточное ПО для проверки авторизации в API-запросах
 * @param req Запрос Next.js
 * @returns Результат авторизации (успех/неудача, ID пользователя, ошибка) или NextResponse с ошибкой
 */
export async function authMiddleware(req: NextRequest): Promise<AuthResult | NextResponse> {
  try {
    // Получаем токен из cookie
    const token = req.cookies.get('token')?.value;
    
    // Если токен отсутствует, возвращаем ошибку
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    
    try {
      // Проверяем токен
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };
      
      // Если токен прошел проверку, возвращаем успех и ID пользователя
      return {
        success: true,
        userId: decoded.userId,
        role: decoded.role
      };
    } catch (jwtError) {
      // Ошибка проверки токена (истек срок, подделка и т.д.)
      console.error('Ошибка проверки JWT:', jwtError);
      
      return NextResponse.json(
        { success: false, message: 'Недействительный токен авторизации' },
        { status: 401 }
      );
    }
  } catch (error) {
    // Непредвиденная ошибка
    console.error('Ошибка авторизации:', error);
    
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера при авторизации' },
      { status: 500 }
    );
  }
}

/**
 * Проверка роли пользователя
 * @param req Запрос Next.js
 * @param allowedRoles Разрешенные роли
 * @returns Результат проверки роли или NextResponse с ошибкой
 */
export async function checkRole(req: NextRequest, allowedRoles: string[]): Promise<AuthResult | NextResponse> {
  const authResult = await authMiddleware(req);
  
  if ('success' in authResult) {
    if (authResult.success && authResult.role && allowedRoles.includes(authResult.role)) {
      return authResult;
    } else {
      return NextResponse.json(
        { success: false, message: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      );
    }
  }
  
  return authResult;
}

/**
 * Получение данных пользователя из токена
 * @param token JWT токен
 * @returns Данные пользователя или null в случае ошибки
 */
export function getUserFromToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    
    return decoded;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя из токена:', error);
    return null;
  }
}
