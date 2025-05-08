'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TroubleshootPage() {
  const [parserStatus, setParserStatus] = useState<'loading' | 'online' | 'offline'>('loading')
  const [gcsStatus, setGcsStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Проверка статуса парсера
    fetch('/api/parser/health')
      .then(res => res.json())
      .then(data => {
        setParserStatus(data.status === 'ok' ? 'online' : 'offline')
      })
      .catch(() => {
        setParserStatus('offline')
      })

    // Проверка статуса базы данных
    fetch('/api/health/database')
      .then(res => res.json())
      .then(data => {
        setDbStatus(data.status === 'ok' ? 'connected' : 'error')
      })
      .catch(() => {
        setDbStatus('error')
      })

    // Проверка статуса Google Cloud Storage
    fetch('/api/health/storage')
      .then(res => res.json())
      .then(data => {
        setGcsStatus(data.status === 'ok' ? 'connected' : 'error')
      })
      .catch(() => {
        setGcsStatus('error')
      })
  }, [])

  const getStatusColor = (status: 'loading' | 'online' | 'offline' | 'connected' | 'error') => {
    switch (status) {
      case 'loading':
        return 'bg-yellow-100 text-yellow-800'
      case 'online':
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'offline':
      case 'error':
        return 'bg-red-100 text-red-800'
    }
  }

  const startParser = async () => {
    try {
      setError(null)
      const res = await fetch('/api/parser/start', { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        alert('Запрос на запуск парсера отправлен. Проверьте статус через несколько секунд.')
      } else {
        setError(data.error || 'Ошибка при запуске парсера')
      }
    } catch (error) {
      setError('Не удалось отправить запрос на запуск парсера')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Диагностика и устранение неполадок</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Статус парсера</h2>
          <p className={`inline-flex px-2 py-1 rounded ${getStatusColor(parserStatus)}`}>
            {parserStatus === 'loading' ? 'Проверка...' : parserStatus === 'online' ? 'Онлайн' : 'Офлайн'}
          </p>
          {parserStatus === 'offline' && (
            <div className="mt-4">
              <p className="text-sm mb-2">Сервис парсинга файлов не доступен. Возможные причины:</p>
              <ul className="text-sm list-disc pl-5 mb-4">
                <li>Сервис не запущен</li>
                <li>Сервис запущен на другом порту</li>
                <li>Проблемы с сетевым подключением</li>
              </ul>
              <button 
                onClick={startParser}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Запустить парсер
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Статус базы данных</h2>
          <p className={`inline-flex px-2 py-1 rounded ${getStatusColor(dbStatus)}`}>
            {dbStatus === 'loading' ? 'Проверка...' : dbStatus === 'connected' ? 'Подключено' : 'Ошибка подключения'}
          </p>
          {dbStatus === 'error' && (
            <div className="mt-4">
              <p className="text-sm mb-2">Проблемы с подключением к базе данных. Проверьте:</p>
              <ul className="text-sm list-disc pl-5">
                <li>Строку подключения в .env файле</li>
                <li>Доступность Supabase</li>
                <li>Права доступа пользователя</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Статус хранилища файлов</h2>
          <p className={`inline-flex px-2 py-1 rounded ${getStatusColor(gcsStatus)}`}>
            {gcsStatus === 'loading' ? 'Проверка...' : gcsStatus === 'connected' ? 'Подключено' : 'Ошибка подключения'}
          </p>
          {gcsStatus === 'error' && (
            <div className="mt-4">
              <p className="text-sm mb-2">Проблемы с подключением к Google Cloud Storage. Проверьте:</p>
              <ul className="text-sm list-disc pl-5">
                <li>Ключ сервисного аккаунта в папке keys</li>
                <li>Настройки GCS в .env файле</li>
                <li>Права доступа сервисного аккаунта</li>
                <li>Существование бакета</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Руководство по устранению неполадок</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Проблемы с загрузкой файлов</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Убедитесь, что сервис Google Cloud Storage доступен</li>
            <li>Проверьте права доступа сервисного аккаунта</li>
            <li>Посмотрите логи на сервере</li>
            <li>Проверьте наличие бакета {process.env.GCS_BUCKET || 'baassist-files'}</li>
          </ol>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Проблемы с обработкой файлов</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Убедитесь, что сервис парсера запущен. Для запуска выполните в терминале:
              <pre className="bg-gray-800 text-green-400 p-2 rounded mt-1 text-sm">
                cd C:\baas\baassist\parser && npm start
              </pre>
            </li>
            <li>Проверьте, доступен ли файл в хранилище Google Cloud Storage</li>
            <li>Убедитесь, что файл имеет поддерживаемый формат (docx, doc, txt, pdf)</li>
            <li>Проверьте логи на сервере</li>
          </ol>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Запуск всех сервисов</h3>
          <p className="mb-2">Для полноценной работы приложения необходимо:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Запустить основное приложение:
              <pre className="bg-gray-800 text-green-400 p-2 rounded mt-1 text-sm">
                cd C:\baas\baassist && npm run dev
              </pre>
            </li>
            <li>Запустить сервис парсера в отдельном терминале:
              <pre className="bg-gray-800 text-green-400 p-2 rounded mt-1 text-sm">
                cd C:\baas\baassist\parser && npm start
              </pre>
            </li>
          </ol>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-blue-500 hover:text-blue-700">
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}