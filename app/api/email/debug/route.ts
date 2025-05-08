import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { authMiddleware } from '@/lib/auth';
import { checkRole } from '@/lib/auth';

/**
 * API-endpoint для проверки конфигурации email и диагностики проблем
 * GET /api/email/debug
 */
export async function GET(req: NextRequest) {
  try {
    // Проверяем аутентификацию - только владельцы могут видеть детальную информацию
    const authResult = await checkRole(req, ['OWNER']);
    if (!('success' in authResult) || !authResult.success) {
      return NextResponse.json({ error: 'Недостаточно прав для выполнения операции' }, { status: 403 });
    }

    // Собираем информацию о настройках
    const emailSettings = {
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || null,
      user: process.env.SMTP_USER || null,
      secureConnection: process.env.SMTP_PORT === '465',
      emailFrom: process.env.EMAIL_FROM || null,
      nodeEnv: process.env.NODE_ENV || 'not-set',
      emailTestMode: process.env.EMAIL_TEST_MODE || 'not-set'
    };

    // Тестируем соединение с SMTP сервером
    let connectionStatus = 'unknown';
    let connectionDetails = null;
    
    try {
      // Создаем тестовый транспорт
      const testTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT || '587') === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        debug: true,
        logger: true // Включаем логирование для диагностики
      });
      
      // Проверяем соединение
      const verifyResult = await testTransporter.verify();
      connectionStatus = 'success';
      connectionDetails = { verified: true, result: verifyResult };
    } catch (error) {
      connectionStatus = 'error';
      connectionDetails = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    return NextResponse.json({
      settings: emailSettings,
      connection: {
        status: connectionStatus,
        details: connectionDetails
      },
      time: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    console.error('Ошибка при проверке настроек email:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Внутренняя ошибка сервера при проверке настроек email',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}