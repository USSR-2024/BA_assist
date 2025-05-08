'use client'

import { useState, useEffect } from 'react'
import { ENV } from '@/lib/env'

export default function AIStatusPanel() {
  const [modelInfo, setModelInfo] = useState({
    enabled: false,
    model: ''
  })
  
  useEffect(() => {
    // В клиентском компоненте мы не можем напрямую получить ENV,
    // поэтому добавим API эндпоинт для получения информации о модели
    const fetchModelInfo = async () => {
      try {
        const res = await fetch('/api/ai/status')
        
        if (res.ok) {
          const data = await res.json()
          setModelInfo({
            enabled: data.enabled,
            model: data.model
          })
        }
      } catch (error) {
        console.error('Ошибка получения статуса AI:', error)
      }
    }
    
    fetchModelInfo()
  }, [])
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Статус интеграции с OpenAI
        </h3>
      </div>
      
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Статус</dt>
            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
              {modelInfo.enabled ? (
                <span className="text-green-600 font-medium">Активно</span>
              ) : (
                <span className="text-yellow-600 font-medium">Не настроено</span>
              )}
            </dd>
          </div>
          
          {modelInfo.enabled && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Модель</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {modelInfo.model || 'gpt-3.5-turbo (по умолчанию)'}
              </dd>
            </div>
          )}
          
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Настройка</dt>
            <dd className="mt-1 text-sm text-gray-500 sm:mt-0 sm:col-span-2">
              Интеграция с OpenAI настраивается администратором через переменные окружения:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><code>OPENAI_API_KEY</code> - API ключ OpenAI</li>
                <li><code>OPENAI_MODEL</code> - модель (gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview)</li>
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}