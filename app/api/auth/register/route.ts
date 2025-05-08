// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import emailService from '@/app/services/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email, password, role, invitationToken } = data;
    
    // Проверка обязательных полей
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }
    
    // Проверка, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }
    
    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Определяем роль пользователя
    let userRole = 'MEMBER'; // По умолчанию - MEMBER
    
    // Проверяем, есть ли уже пользователи в системе
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;
    
    // Первый пользователь может стать владельцем (OWNER)
    if (isFirstUser && role === 'OWNER') {
      userRole = 'OWNER';
    } else if (role === 'OWNER' && !isFirstUser) {
      // Проверим, что нет слишком много OWNER пользователей
      const ownersCount = await prisma.user.count({
        where: { role: 'OWNER' }
      });
      
      // Если владельцев немного, разрешаем создать еще одного
      if (ownersCount < 3) {
        userRole = 'OWNER';
      }
    }
    
    // Храним информацию о проекте, если есть токен приглашения
    let projectId: number | null = null;
    
    // Если есть токен приглашения, проверяем его
    if (invitationToken) {
      try {
        const decoded = jwt.verify(invitationToken, JWT_SECRET) as {
          projectId: number;
          email: string;
          inviterId: string;
          type: string;
        };
        
        // Проверяем тип токена и email
        if (decoded.type !== 'project-invitation' || decoded.email !== email) {
          return NextResponse.json(
            { error: 'Недействительный токен приглашения' },
            { status: 400 }
          );
        }
        
        // Сохраняем ID проекта для последующего подключения пользователя
        projectId = decoded.projectId;
        
        // Для приглашенных пользователей роль всегда MEMBER
        userRole = 'MEMBER';
      } catch (jwtError) {
        console.error('Ошибка проверки токена приглашения:', jwtError);
        return NextResponse.json(
          { error: 'Недействительный или просроченный токен приглашения' },
          { status: 400 }
        );
      }
    }
    
    // Создание пользователя с указанной ролью
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isVerified: false,
        role: userRole as any, // Приведение к типу Role
      },
    });
    
    // Если был токен приглашения, добавляем пользователя в проект
    if (projectId) {
      try {
        // Проверяем существование проекта
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        });
        
        if (project) {
          // Добавляем пользователя в проект
          await prisma.project.update({
            where: { id: projectId },
            data: {
              users: {
                connect: { id: user.id }
              }
            }
          });
          
          console.log(`Пользователь ${user.id} добавлен в проект ${projectId}`);
        }
      } catch (projectError) {
        console.error('Ошибка при добавлении пользователя в проект:', projectError);
        // Не прерываем регистрацию, если не удалось добавить в проект
      }
    }
    
    // Создание токена для верификации email
    const verificationToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'verification'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Отправляем письмо для верификации
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
      console.log('Письмо для верификации отправлено на адрес:', email);
    } catch (emailError) {
      console.error('Ошибка отправки письма верификации:', emailError);
      // Не прерываем регистрацию, если письмо не отправлено
    }
    
    // Формируем ответ
    const responseData: any = {
      message: 'Пользователь успешно зарегистрирован. Проверьте почту для подтверждения.',
      userId: user.id,
      role: userRole
    };
    
    // Если пользователь был приглашен в проект, добавляем эту информацию
    if (projectId) {
      responseData.projectId = projectId;
      responseData.invited = true;
    }
    
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при регистрации' },
      { status: 500 }
    );
  }
}