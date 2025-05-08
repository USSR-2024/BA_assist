FROM node:18-alpine AS deps

WORKDIR /app

# Копируем файлы для установки зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости и генерируем Prisma-клиент
RUN npm ci

# Build-этап
FROM node:18-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma-клиент и собираем приложение
RUN npx prisma generate
RUN npm run build

# Рабочий этап
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Копируем необходимые файлы из build-этапа
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/scripts ./scripts

# Копируем скрипт для инициализации приложения
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Порт, который будет прослушивать приложение
EXPOSE 3000

# Проверка работоспособности
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/database || exit 1

# Запуск приложения
CMD ["/app/docker-entrypoint.sh"]