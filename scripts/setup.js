#!/usr/bin/env node

/**
 * Скрипт для настройки и проверки проекта BA Assist
 * Проверяет все необходимые зависимости, запускает миграции и заполняет базу данными
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');
const ENV_EXAMPLE_FILE = path.join(ROOT_DIR, '.env.example');

/**
 * Основная функция установки
 */
async function setup() {
  console.log('\n=== Настройка проекта BA Assist ===\n');
  
  // Шаг 1: Проверка наличия .env файла
  await checkEnvFile();
  
  // Шаг 2: Проверка подключения к базе данных
  await checkDatabaseConnection();
  
  // Шаг 3: Запуск миграций
  await runMigrations();
  
  // Шаг 4: Заполнение базы начальными данными
  await seedDatabase();
  
  console.log('\n=== Настройка успешно завершена! ===\n');
  console.log('Для запуска приложения выполните:');
  console.log('  npm run dev');
  console.log('\nДля запуска сервиса парсера в отдельном терминале выполните:');
  console.log('  cd parser && npm start');
  
  rl.close();
}

/**
 * Проверка наличия .env файла и создание его из примера при необходимости
 */
async function checkEnvFile() {
  console.log('Проверка наличия .env файла...');
  
  if (!fs.existsSync(ENV_FILE)) {
    console.log('.env файл не найден. Создание из примера...');
    
    if (!fs.existsSync(ENV_EXAMPLE_FILE)) {
      console.error('Ошибка: .env.example файл не найден. Невозможно создать .env файл.');
      process.exit(1);
    }
    
    // Копируем .env.example в .env
    fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
    console.log('Создан .env файл из примера.');
    console.log('ВНИМАНИЕ: Необходимо настроить параметры в .env файле для корректной работы приложения.');
    
    // Запрашиваем у пользователя строку подключения к БД
    const dbUrl = await askQuestion('Введите строку подключения к базе данных (DATABASE_URL): ');
    
    // Обновляем .env файл
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');
    envContent = envContent.replace(/DATABASE_URL=".*"/g, `DATABASE_URL="${dbUrl}"`);
    fs.writeFileSync(ENV_FILE, envContent);
    
    console.log('Строка подключения к базе данных обновлена в .env файле.');
  } else {
    console.log('.env файл найден.');
  }
}

/**
 * Проверка подключения к базе данных
 */
async function checkDatabaseConnection() {
  console.log('\nПроверка подключения к базе данных...');
  
  try {
    execSync('npx prisma db pull --force', { stdio: 'inherit' });
    console.log('Подключение к базе данных успешно.');
  } catch (error) {
    console.error('Ошибка подключения к базе данных.');
    console.error('Проверьте параметр DATABASE_URL в .env файле и доступность сервера БД.');
    
    const retry = await askQuestion('Повторить попытку после настройки? (y/n): ');
    if (retry.toLowerCase() === 'y') {
      return checkDatabaseConnection();
    } else {
      console.log('Установка прервана. Настройте параметры подключения к БД и запустите скрипт снова.');
      process.exit(1);
    }
  }
}

/**
 * Запуск миграций базы данных
 */
async function runMigrations() {
  console.log('\nЗапуск миграций базы данных...');
  
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Миграции успешно применены.');
  } catch (error) {
    console.error('Ошибка при выполнении миграций.');
    
    const reset = await askQuestion('Хотите сбросить базу данных и применить миграции заново? (y/n): ');
    if (reset.toLowerCase() === 'y') {
      try {
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
        console.log('База данных сброшена и миграции применены заново.');
        return;
      } catch (resetError) {
        console.error('Ошибка при сбросе базы данных.');
        process.exit(1);
      }
    } else {
      console.log('Миграции не применены. Дальнейшая установка может быть некорректной.');
    }
  }
}

/**
 * Заполнение базы начальными данными
 */
async function seedDatabase() {
  console.log('\nЗаполнение базы данных начальными данными...');
  
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('База данных успешно заполнена начальными данными.');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных.');
    console.error('Вы можете попробовать запустить seed вручную командой: npx prisma db seed');
  }
}

/**
 * Вспомогательная функция для запроса ввода пользователя
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Запуск основной функции
setup().catch(console.error);
