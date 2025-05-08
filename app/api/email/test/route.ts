import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/app/services/email';
import { authMiddleware } from '@/lib/auth';

/**
 * API-endpoint для тестирования отправки email
 * POST /api/email/test
 */
export async function POST(req: NextRequest) {
  try {
    // Проверяем аутентификацию - только авторизованные пользователи могут запускать тест
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Получаем параметры из тела запроса
    const body = await req.json();
    const { email } = body;

    // Проверяем, что email указан
    if (!email) {
      return NextResponse.json({ error: 'Email адрес не указан' }, { status: 400 });
    }

    // Проверяем формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Некорректный формат email адреса' }, { status: 400 });
    }

    console.log(`Запуск тестовой отправки email на адрес: ${email}`);

    // Запускаем тестовую отправку
    const result = await emailService.sendTestEmail(email);

    if (result) {
      return NextResponse.json({
        success: true,
        message: `Тестовое письмо отправлено на адрес ${email}. Проверьте вашу почту.`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Не удалось отправить тестовое письмо. Проверьте настройки SMTP в .env файле.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Ошибка при тестировании отправки email:', error);
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера при тестировании отправки email',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * API-endpoint для проверки состояния настроек email
 * GET /api/email/test
 */
export async function GET(req: NextRequest) {
  try {
    // Проверяем аутентификацию - только авторизованные пользователи могут запускать тест
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Проверяем соединение с SMTP-сервером
    const connectionStatus = await emailService.verifyConnection();

    // Проверяем настройки email
    const emailSettings = {
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || null,
      user: process.env.SMTP_USER ? 'configured' : null,
      pass: process.env.SMTP_PASS ? 'configured' : null,
      from: process.env.EMAIL_FROM || null,
      testMode: process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST
    };

    // Определяем общий статус
    const status = connectionStatus ? 'ok' : 'error';

    return NextResponse.json({
      status,
      connectionStatus,
      emailSettings,
      message: connectionStatus 
        ? 'Email сервис настроен и готов к использованию' 
        : 'Проблема с подключением к SMTP-серверу. Проверьте настройки.'
    });
  } catch (error) {
    console.error('Ошибка при проверке настроек email:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Внутренняя ошибка сервера при проверке настроек email',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}