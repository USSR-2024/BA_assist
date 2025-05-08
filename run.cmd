@echo off
REM Скрипт для запуска BA Assist

echo ===================================
echo    Запуск проекта BA Assist
echo ===================================
echo.

REM Проверяем наличие заполненной БД
echo Проверка базы данных...
npx prisma db pull --force >nul 2>&1

IF %ERRORLEVEL% NEQ 0 (
  echo ОШИБКА: Проблема с подключением к базе данных.
  echo Пожалуйста, проверьте .env файл и выполните настройку.
  echo.
  echo Для настройки выполните:
  echo   node scripts/setup.js
  goto :EOF
)

REM Запускаем приложение
start cmd /k "title BA Assist - Next.js Server && echo Запуск Next.js сервера... && npm run dev"

REM Проверяем наличие сервиса парсера и запускаем его
IF EXIST parser\package.json (
  echo Найден сервис парсера. Запуск...
  start cmd /k "title BA Assist - Parser Service && cd parser && npm start"
) ELSE (
  echo ПРЕДУПРЕЖДЕНИЕ: Директория сервиса парсера не найдена.
  echo Некоторые функции приложения могут не работать.
)

echo.
echo ===================================
echo Приложение запущено! 
echo Откройте http://localhost:3000 в браузере
echo ===================================
