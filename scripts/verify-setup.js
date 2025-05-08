#!/usr/bin/env node

/**
 * Скрипт для проверки правильной настройки BAssist
 * Запускается для проверки, что все необходимые компоненты и файлы в наличии
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const requiredFiles = [
  // Корневые файлы
  '.env.example',
  'package.json',
  'next.config.js',
  'prisma/schema.prisma',
  'docker-compose.yml',
  
  // Компоненты приложения
  'app/layout.tsx',
  'app/page.tsx',
  'app/auth/login/page.tsx',
  'app/auth/register/page.tsx',
  'app/dashboard/page.tsx',
  'app/dashboard/projects/new/page.tsx',
  'app/dashboard/projects/[id]/layout.tsx',
  'app/dashboard/projects/[id]/files/page.tsx',
  'app/dashboard/projects/[id]/chat/page.tsx',
  'app/dashboard/projects/[id]/tasks/page.tsx',
  'app/knowledge/page.tsx',
  'app/profile/page.tsx',
  
  // API эндпоинты
  'app/api/auth/login/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/projects/route.ts',
  'app/api/projects/[id]/files/route.ts',
  'app/api/projects/[id]/chat/route.ts',
  'app/api/projects/[id]/tasks/route.ts',
  'app/api/projects/[id]/summary/route.ts',
  'app/api/files/route.ts',
  'app/api/files/[id]/process/route.ts',
  'app/api/tasks/[id]/route.ts',
  'app/api/upload/route.ts',
  'app/api/search/route.ts',
  'app/api/glossary/route.ts',
  'app/api/glossary/[id]/route.ts',
  
  // Сервис парсера
  'parser/server.js',
  'parser/package.json',
  'parser/Dockerfile',
];

const checkFiles = () => {
  console.log('Проверка наличия всех необходимых файлов...');
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length === 0) {
    console.log('✅ Все необходимые файлы найдены.');
    return true;
  } else {
    console.error('❌ Отсутствуют следующие файлы:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    return false;
  }
};

const checkPrismaSchema = async () => {
  console.log('Проверка Prisma схемы...');
  
  try {
    await execPromise('npx prisma validate');
    console.log('✅ Prisma схема валидна.');
    return true;
  } catch (error) {
    console.error('❌ Ошибка валидации Prisma схемы:', error.message);
    return false;
  }
};

const checkNextBuild = async () => {
  console.log('Проверка возможности сборки Next.js приложения...');
  
  try {
    await execPromise('npm run build');
    console.log('✅ Next.js приложение собирается успешно.');
    return true;
  } catch (error) {
    console.error('❌ Ошибка сборки Next.js приложения:', error.message);
    return false;
  }
};

const main = async () => {
  console.log('=== Проверка настройки BAssist ===');
  console.log('');
  
  const filesOk = checkFiles();
  
  if (!filesOk) {
    console.error('❌ Некоторые файлы отсутствуют. Прерывание проверки.');
    process.exit(1);
  }
  
  const prismaOk = await checkPrismaSchema();
  
  if (!prismaOk) {
    console.error('❌ Ошибка валидации Prisma схемы. Прерывание проверки.');
    process.exit(1);
  }
  
  console.log('');
  console.log('✅ Базовая проверка пройдена успешно.');
  console.log('');
  console.log('Следующие шаги:');
  console.log('1. Создайте и настройте файл .env на основе .env.example');
  console.log('2. Запустите `npx prisma migrate dev` для создания базы данных');
  console.log('3. Запустите `npm run dev` для локальной разработки');
  console.log('или `docker-compose up -d` для запуска с Docker');
  console.log('');
};

main().catch(e => {
  console.error('Произошла ошибка во время проверки:', e);
  process.exit(1);
});
