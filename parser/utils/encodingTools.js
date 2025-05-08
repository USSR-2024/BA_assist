const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const jschardet = require('jschardet');
const encoding = require('encoding');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

/**
 * Обнаруживает кодировку файла, используя несколько библиотек
 * @param {string} filePath Путь к файлу
 * @returns {string} Обнаруженная кодировка
 */
function detectFileEncoding(filePath) {
  // Первая попытка - chardet
  try {
    const detected = chardet.detectFileSync(filePath);
    if (detected) {
      console.log(`Кодировка обнаружена с помощью chardet: ${detected}`);
      return detected;
    }
  } catch (err) {
    console.log('Ошибка при определении кодировки через chardet:', err.message);
  }
  
  // Вторая попытка - чтение буфера и jschardet
  try {
    const buffer = fs.readFileSync(filePath);
    const result = jschardet.detect(buffer);
    if (result && result.encoding) {
      console.log(`Кодировка обнаружена с помощью jschardet: ${result.encoding} (уверенность: ${result.confidence})`);
      return result.encoding;
    }
  } catch (err) {
    console.log('Ошибка при определении кодировки через jschardet:', err.message);
  }
  
  // По умолчанию
  return 'windows-1251'; // Предполагаем Windows-1251 для русского текста
}

/**
 * Читает содержимое текстового файла с правильной кодировкой
 * @param {string} filePath Путь к файлу
 * @returns {Promise<string>} Содержимое файла в UTF-8
 */
async function readTextFileWithCorrectEncoding(filePath) {
  // Определяем кодировку
  const detectedEncoding = detectFileEncoding(filePath);
  console.log(`Детектирована кодировка: ${detectedEncoding}`);
  
  // Читаем файл в буфер
  const fileBuffer = await readFileAsync(filePath);
  
  // Определяем, какую кодировку использовать
  let encoding = detectedEncoding;
  
  // Нормализуем названия кодировок
  if (encoding.toLowerCase().includes('windows') || 
      encoding.toLowerCase().includes('1251') ||
      encoding.toLowerCase().includes('cp1251')) {
    encoding = 'win1251';
  } else if (encoding.toLowerCase().includes('utf-8') || 
             encoding.toLowerCase().includes('utf8')) {
    encoding = 'utf8';
  }
  
  // Пробуем разные варианты декодирования
  let textContent = '';
  let success = false;
  
  // Список кодировок для попытки, начиная с обнаруженной
  const encodingsToTry = [
    encoding,
    'win1251',
    'cp1251',
    'windows-1251',
    'koi8-r',
    'iso-8859-5',
    'utf8'
  ];
  
  // Пробуем все кодировки, пока не найдем работающую
  for (const enc of encodingsToTry) {
    if (!iconv.encodingExists(enc)) continue;
    
    try {
      textContent = iconv.decode(fileBuffer, enc);
      
      // Проверка на наличие знаков "РЎ" и других артефактов неправильной кодировки
      if (!textContent.includes('РЎ') && !textContent.includes('РЈ') && !textContent.includes('РЏ')) {
        console.log(`Успешная декодировка с кодировкой: ${enc}`);
        success = true;
        break;
      }
    } catch (e) {
      console.log(`Ошибка при декодировании с ${enc}:`, e.message);
    }
  }
  
  // Если ни одна кодировка не сработала, пробуем запасной вариант
  if (!success) {
    console.log('Все попытки декодирования не удались, пробуем прямое чтение');
    try {
      // Прямое чтение как двоичный файл и ручная конвертация
      const binary = fileBuffer.toString('binary');
      textContent = encoding.convert(binary, 'utf8').toString();
    } catch (e) {
      console.log('Ошибка при запасном декодировании:', e.message);
      // Последняя попытка - просто прочитать как UTF-8
      textContent = fileBuffer.toString('utf8');
    }
  }
  
  // Финальная проверка на наличие артефактов кодировки
  if (textContent.includes('РЎ') || textContent.includes('РЈ') || textContent.includes('РЏ')) {
    console.log('Предупреждение: в тексте все еще есть артефакты кодировки после всех попыток декодирования');
  }
  
  return textContent;
}

module.exports = {
  detectFileEncoding,
  readTextFileWithCorrectEncoding
};