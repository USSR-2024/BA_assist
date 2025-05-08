const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Импорт маршрутов
const healthRoutes = require('./routes/health');
const extractTextRoutes = require('./routes/extract-text');

// Настройка Express приложения
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Маршруты
app.use('/health', healthRoutes);
app.use('/extract-text', extractTextRoutes);

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'БА Ассист - Сервис обработки документов',
    status: 'running',
    endpoints: [
      { path: '/health', method: 'GET', description: 'Проверка работоспособности сервиса' },
      { path: '/extract-text', method: 'POST', description: 'Извлечение текста из документа по URL' }
    ]
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервис обработки файлов запущен на порту ${PORT}`);
});

process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение Promise:', reason);
});
