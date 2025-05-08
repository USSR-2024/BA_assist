FROM node:18-alpine

WORKDIR /usr/src/app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код приложения
COPY . .

# Порт, который будет прослушивать приложение
EXPOSE 4000

# Команда для запуска приложения
CMD ["node", "index.js"]