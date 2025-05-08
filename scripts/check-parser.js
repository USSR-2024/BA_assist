const axios = require('axios');

// Скрипт для проверки доступности и работоспособности parser-сервиса
async function checkParserService() {
  console.log('Проверка доступности парсер-сервиса...');
  
  const parserUrl = process.env.PARSER_URL || 'http://localhost:4000/extract-text';
  const healthUrl = parserUrl.replace('/extract-text', '/health');
  
  try {
    console.log(`Запрос к ${healthUrl}...`);
    const response = await axios.get(healthUrl);
    
    if (response.status === 200) {
      console.log('✅ Парсер-сервис доступен и работает корректно!');
      return true;
    } else {
      console.error(`❌ Парсер-сервис вернул неожиданный статус: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке парсер-сервиса:');
    console.error(error.message);
    
    console.log('\nВозможные причины ошибки:');
    console.log('1. Парсер-сервис не запущен. Запустите его командой:');
    console.log('   cd parser && npm start');
    console.log('2. Неверный адрес парсер-сервиса в .env файле');
    console.log('3. Проблемы с сетевым подключением');
    return false;
  }
}

// Запустить проверку
checkParserService().then((isAvailable) => {
  if (!isAvailable) {
    console.log('\nЧтобы запустить парсер-сервис:');
    console.log('1. Откройте новый терминал');
    console.log('2. Перейдите в директорию parser: cd C:\\baas\\baassist\\parser');
    console.log('3. Установите зависимости (если это еще не сделано): npm install');
    console.log('4. Запустите сервер: npm start');
    console.log('5. После этого вернитесь к приложению и попробуйте обработать файл снова');
  }
});
