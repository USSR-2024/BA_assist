const express = require('express');
const router = express.Router();
const axios = require('axios');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const encoding = require('encoding');
const stringToArrayBuffer = require('string-to-arraybuffer');
const encodingTools = require('../utils/encodingTools');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readFileAsync = promisify(fs.readFile);

// Преобразование кириллической кодировки
function fixCyrillicEncoding(text) {
  // Проверка на типичные артефакты неправильной кодировки кириллицы
  const cyrillicPattern = /[РА-РЯ]/g;
  
  if (cyrillicPattern.test(text)) {
    try {
      // Пробуем преобразовать текст из Windows-1251 в UTF-8
      const buffer = Buffer.from(text);
      const detectedEncoding = chardet.detect(buffer);
      
      console.log(`Обнаружена проблема с кодировкой. Предполагаемая кодировка: ${detectedEncoding}`);
      
      // Список кодировок для попытки преобразования
      const encodings = ['windows-1251', 'koi8-r', 'iso-8859-5', 'utf-8'];
      
      for (const enc of encodings) {
        try {
          if (iconv.encodingExists(enc)) {
            const decoded = iconv.decode(Buffer.from(text, 'binary'), enc);
            
            // Проверяем, исчезли ли артефакты кодировки
            if (!/[РА-РЯ]/.test(decoded) && /[а-яА-Я]/.test(decoded)) {
              console.log(`Успешное преобразование с использованием кодировки ${enc}`);
              return decoded;
            }
          }
        } catch (e) {
          console.error(`Ошибка при попытке преобразования с кодировкой ${enc}:`, e.message);
        }
      }
      
      // Если ничего не помогло, пробуем использовать encoding
      try {
        const converted = encoding.convert(text, 'UTF-8').toString();
        if (!/[РА-РЯ]/.test(converted) && /[а-яА-Я]/.test(converted)) {
          console.log('Успешное преобразование с использованием библиотеки encoding');
          return converted;
        }
      } catch (e) {
        console.error('Ошибка при использовании библиотеки encoding:', e.message);
      }
    } catch (error) {
      console.error('Ошибка при преобразовании кодировки:', error);
    }
  }
  
  // Если ничего не помогло или нет проблем с кодировкой, возвращаем исходный текст
  return text;
}

/**
 * @route POST /extract-text
 * @desc Извлечение текста из документа по URL
 * @access Public
 */
router.post('/', async (req, res) => {
  const { url, fileName } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL документа обязателен' });
  }
  
  // Если передано имя файла, используем его для лучшего определения типа
  const providedExtension = fileName ? path.extname(fileName).toLowerCase() : null;

  const tempDir = path.join(os.tmpdir(), 'baassist-parser');
  
  // Создаем временную директорию, если её нет
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Генерируем уникальное имя файла
  const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`);
  
  try {
    console.log(`Загрузка файла с URL: ${url.substring(0, 100)}...`);
    
    // Загружаем файл
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });
    
    const fileBuffer = Buffer.from(response.data);
    
    // Определяем тип файла по заголовкам или имени файла
    const contentType = response.headers['content-type'] || '';
    let extension = '.txt';
    
    // Если есть расширение в имени файла, используем его в приоритете
    if (providedExtension) {
      extension = providedExtension;
      console.log(`Используем расширение из имени файла: ${extension}`);
    } else {
      // Иначе определяем по типу контента
      if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        extension = '.docx';
      } else if (contentType.includes('application/pdf')) {
        extension = '.pdf';
      } else if (contentType.includes('text/plain')) {
        extension = '.txt';
      }
      console.log(`Определен тип файла по Content-Type: ${contentType}, используем расширение: ${extension}`);
    }
    
    const fullTempFilePath = `${tempFilePath}${extension}`;
    
    // Сохраняем файл во временную директорию
    await writeFileAsync(fullTempFilePath, fileBuffer);
    console.log(`Файл сохранен: ${fullTempFilePath}`);
    
    // Определяем кодировку файла
    const detectedEncoding = chardet.detectFileSync(fullTempFilePath);
    console.log(`Определена кодировка файла: ${detectedEncoding}`);
    
    // Извлекаем текст в зависимости от типа файла
    let extractedText = '';
    
    if (extension === '.docx') {
      try {
        // Попытка 1: Обычный подход
        const result = await mammoth.extractRawText({ path: fullTempFilePath });
        extractedText = result.value;
        
        // Проверяем, есть ли проблемы с кодировкой
        if (/[РА-РЯ]/.test(extractedText)) {
          console.log('Обнаружены проблемы с кодировкой в DOCX. Пробуем альтернативные методы извлечения...');
          
          // Попытка 2: Использование буфера
          const fileData = await readFileAsync(fullTempFilePath);
          const bufferResult = await mammoth.extractRawText({ buffer: fileData });
          
          if (!/[РА-РЯ]/.test(bufferResult.value)) {
            extractedText = bufferResult.value;
          } else {
            // Фиксим кодировку
            extractedText = fixCyrillicEncoding(extractedText);
          }
        }
        
        console.log(`Обработан DOCX файл, извлечено ${extractedText.length} символов`);
      } catch (docxError) {
        console.error('Ошибка при обработке DOCX файла:', docxError);
        throw docxError;
      }
    } else if (extension === '.pdf') {
      try {
        const data = await pdfParse(fileBuffer);
        extractedText = data.text;
        
        // Проверяем и исправляем кодировку, если нужно
        if (/[РА-РЯ]/.test(extractedText)) {
          console.log('Обнаружены проблемы с кодировкой в PDF. Исправляем...');
          extractedText = fixCyrillicEncoding(extractedText);
        }
        
        console.log(`Обработан PDF файл, извлечено ${extractedText.length} символов`);
      } catch (pdfError) {
        console.error('Ошибка при обработке PDF файла:', pdfError);
        throw pdfError;
      }
    } else {
      // Текстовый файл - используем специализированный инструмент для работы с кодировками
      try {
        console.log('Обработка текстового файла с использованием специализированных инструментов');
        
        // Используем специальный инструмент для обработки текстовых файлов
        extractedText = await encodingTools.readTextFileWithCorrectEncoding(fullTempFilePath);
        
        // Проверяем результат
        if (!extractedText || extractedText.length === 0) {
          console.error('Не удалось извлечь текст из файла');
          throw new Error('Пустой результат при чтении текстового файла');
        }
        
        // Последняя проверка на проблемы с кодировкой
        if (/[РА-РЯ]/.test(extractedText)) {
          console.log('Обнаружены проблемы с кодировкой в тексте. Пробуем исправить...');
          extractedText = fixCyrillicEncoding(extractedText);
        }
        
        console.log(`Обработан текстовый файл, извлечено ${extractedText.length} символов`);
      } catch (textError) {
        console.error('Ошибка при обработке текстового файла:', textError);
        
        // Запасной вариант: использование базового метода чтения файла
        try {
          console.log('Запасной вариант: чтение с предполагаемой кодировкой Windows-1251');
          const content = await readFileAsync(fullTempFilePath);
          extractedText = iconv.decode(content, 'windows-1251');
          
          if (/[РА-РЯ]/.test(extractedText)) {
            console.log('Запасной вариант не решил проблему. Пробуем UTF-8...');
            extractedText = content.toString('utf8');
          }
        } catch (fallbackError) {
          console.error('Ошибка запасного варианта:', fallbackError);
          throw textError; // Возвращаем оригинальную ошибку
        }
      }
    }
    
    // Окончательная проверка на проблемы с кодировкой
    if (/[РА-РЯ]/.test(extractedText)) {
      console.log('После всех попыток все еще есть проблемы с кодировкой. Последняя попытка исправления...');
      extractedText = fixCyrillicEncoding(extractedText);
    }
    
    // Удаляем временный файл
    try {
      await unlinkAsync(fullTempFilePath);
      console.log(`Временный файл удален: ${fullTempFilePath}`);
    } catch (cleanupError) {
      console.error('Ошибка при удалении временного файла:', cleanupError);
      // Продолжаем выполнение, так как это некритичная ошибка
    }
    
    return res.json({
      success: true,
      text: extractedText,
      format: extension.substring(1), // Удаляем точку в начале
      encoding: detectedEncoding || 'unknown'
    });
  } catch (error) {
    console.error('Ошибка при обработке файла:', error);
    
    // Пытаемся удалить временный файл в случае ошибки
    try {
      if (fs.existsSync(`${tempFilePath}`)) {
        await unlinkAsync(`${tempFilePath}`);
      }
    } catch (cleanupError) {
      console.error('Ошибка при удалении временного файла:', cleanupError);
    }
    
    return res.status(500).json({
      error: 'Ошибка при обработке файла',
      details: error.message || 'Неизвестная ошибка'
    });
  }
});

module.exports = router;