#!/bin/sh
set -e

# Ждем, пока база данных станет доступна
echo "Ожидание подключения к базе данных..."
npx wait-on -t 60000 tcp:${DB_HOST}:${DB_PORT}

# Применяем миграции Prisma
echo "Применение миграций базы данных..."
npx prisma migrate deploy

# Заполняем базу данных начальными данными, если это указано
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Заполнение базы данных начальными данными..."
  npx prisma db seed
fi

# Проверяем наличие бизнес-процессов и инициализируем их при необходимости
if [ "$INIT_BUSINESS_PROCESSES" = "true" ]; then
  echo "Инициализация бизнес-процессов..."
  node scripts/init-business-processes.js
fi

# Запускаем Next.js приложение
echo "Запуск приложения..."
npm run start