'use client'

import { useState, useEffect } from 'react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [emailSettings, setEmailSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Загрузка информации о настройках email
    const fetchEmailStatus = async () => {
      try {
        const res = await fetch('/api/email/test')
        const data = await res.json()
        
        if (res.ok) {
          setEmailSettings(data)
          setStatusMessage(data.message)
          setTestStatus(data.status === 'ok' ? 'success' : 'error')
        } else {
          setStatusMessage('Не удалось получить настройки email')
          setTestStatus('error')
        }
      } catch (error) {
        console.error('Ошибка получения настроек email:', error)
        setStatusMessage('Ошибка подключения к серверу')
        setTestStatus('error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchEmailStatus()
  }, [])

  const handleSendTestEmail = async () => {
    if (!email) {
      setStatusMessage('Введите email адрес')
      setTestStatus('error')
      return
    }
    
    setTestStatus('loading')
    setStatusMessage('Отправка тестового письма...')
    
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setStatusMessage(data.message)
        setTestStatus('success')
      } else {
        setStatusMessage(data.error || 'Ошибка отправки тестового письма')
        setTestStatus('error')
      }
    } catch (error) {
      console.error('Ошибка отправки тестового письма:', error)
      setStatusMessage('Ошибка подключения к серверу')
      setTestStatus('error')
    }
  }

  const getStatusBadge = () => {
    switch (testStatus) {
      case 'success':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Активен</span>
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Проблема</span>
      case 'loading':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Проверка...</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Неизвестно</span>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Тестирование Email-сервиса</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Настройки Email</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Статус системы отправки электронных писем.</p>
          </div>
          {getStatusBadge()}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">SMTP Host</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {emailSettings?.emailSettings?.host || 'Не настроен'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">SMTP Port</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {emailSettings?.emailSettings?.port || 'Не настроен'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">SMTP User</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {emailSettings?.emailSettings?.user || 'Не настроен'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Адрес отправителя</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {emailSettings?.emailSettings?.from || 'Не настроен'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Тестовый режим</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {emailSettings?.emailSettings?.testMode ? 'Включен' : 'Отключен'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Соединение с SMTP</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                {emailSettings?.connectionStatus ? (
                  <span className="text-green-600">Установлено</span>
                ) : (
                  <span className="text-red-600">Не установлено</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Отправить тестовое письмо</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Отправьте тестовое письмо для проверки работы email-сервиса.</p>
          </div>
          <div className="mt-5 sm:flex sm:items-center">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testStatus === 'loading'}
              className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {testStatus === 'loading' ? 'Отправка...' : 'Отправить тест'}
            </button>
          </div>
          
          {testStatus !== 'idle' && (
            <div className={`mt-4 p-4 rounded-md ${
              testStatus === 'success' ? 'bg-green-50 text-green-800' :
              testStatus === 'error' ? 'bg-red-50 text-red-800' :
              'bg-yellow-50 text-yellow-800'
            }`}>
              <p>{statusMessage}</p>
            </div>
          )}
          
          <div className="mt-5 text-sm text-gray-500">
            <p>
              <strong>Примечание:</strong> При использовании Gmail в качестве SMTP-сервера, вам может потребоваться разрешить "менее безопасные приложения" в настройках вашего аккаунта или создать специальный "пароль приложения".
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <a href="/dashboard" className="text-primary-600 hover:text-primary-500">
          Вернуться на главную
        </a>
      </div>
    </div>
  )
}