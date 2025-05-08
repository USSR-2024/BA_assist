const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Получаем абсолютный путь к файлу ключа
const keyFilePath = path.resolve('./keys/gcs-service-account-fixed.json');
console.log(`Путь к файлу ключа: ${keyFilePath}`);
console.log(`Файл существует: ${fs.existsSync(keyFilePath)}`);

// Проверяем содержимое файла ключа (только начало для безопасности)
const keyContent = fs.readFileSync(keyFilePath, 'utf8');
console.log(`Размер файла ключа: ${keyContent.length} байт`);
console.log(`Начало содержимого файла: ${keyContent.substring(0, 50)}...`);

// Пытаемся инициализировать Storage
try {
  const storage = new Storage({
    projectId: 'ba-assistant-project',
    keyFilename: keyFilePath,
  });

  console.log('Storage успешно инициализирован');

  // Проверяем доступность бакета
  const bucketName = 'baassist-files';
  const bucket = storage.bucket(bucketName);

  // Пытаемся получить метаданные бакета
  bucket.getMetadata()
    .then(data => {
      console.log(`Бакет ${bucketName} доступен:`);
      console.log(`Создан: ${data[0].timeCreated}`);
      console.log(`Расположение: ${data[0].location}`);
    })
    .catch(err => {
      console.error(`Ошибка доступа к бакету ${bucketName}:`, err);
    });

  // Пытаемся создать тестовый файл
  const testFileName = `test-${Date.now()}.txt`;
  const testFilePath = `test/${testFileName}`;
  const file = bucket.file(testFilePath);

  file.save('Тестовый файл для проверки GCS', {
    contentType: 'text/plain',
    metadata: {
      description: 'Создан для тестирования подключения к GCS'
    }
  })
    .then(() => {
      console.log(`Тестовый файл успешно создан: ${testFilePath}`);
    })
    .catch(err => {
      console.error('Ошибка создания тестового файла:', err);
    });

} catch (error) {
  console.error('Ошибка инициализации Storage:', error);
}
