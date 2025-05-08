'use client'

import { useState, useEffect } from 'react'
import AIStatusPanel from '@/app/components/settings/AIStatusPanel'

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем, что пользователь является администратором (OWNER)
    const checkAuthorization = async () => {
      try {
        const response = await fetch('/api/profile')
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.user && data.user.role === 'OWNER') {
            setIsAuthorized(true)
          } else {
            setIsAuthorized(false)
          }
        } else {
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error)
        setIsAuthorized(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuthorization()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Доступ запрещен! </strong>
          <span className="block sm:inline">У вас нет прав для просмотра этой страницы.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель администратора</h1>
      
      <AIStatusPanel />
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Системные настройки
          </h3>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Переменные окружения</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p className="mb-2">
                  Для настройки системы используются следующие переменные окружения:
                </p>
                <div className="bg-gray-100 p-3 rounded-md">
                  <pre className="text-xs overflow-auto">
                    # Основные настройки<br />
                    NODE_ENV=production<br />
                    APP_URL=https://baassist.example.com<br /><br />
                    
                    # База данных<br />
                    DATABASE_URL=postgresql://user:password@localhost:5432/baassist<br /><br />
                    
                    # AI интеграция<br />
                    OPENAI_API_KEY=sk-...<br />
                    OPENAI_MODEL=gpt-4<br /><br />
                    
                    # Email настройки<br />
                    SMTP_HOST=smtp.example.com<br />
                    SMTP_PORT=587<br />
                    SMTP_USER=user@example.com<br />
                    SMTP_PASS=password<br />
                    EMAIL_FROM=noreply@baassist.com
                  </pre>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}