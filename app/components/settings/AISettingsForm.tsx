'use client'

import { useState, useEffect } from 'react'
import { OpenAIModel } from '@/lib/ai-service'

interface AISettings {
  apiKey?: string
  model: OpenAIModel
  temperature: number
  maxTokens: number
  maskedKey?: string | null
}

export default function AISettingsForm() {
  const [settings, setSettings] = useState<AISettings>({
    model: OpenAIModel.GPT3_5_TURBO,
    temperature: 0.7,
    maxTokens: 1500
  })
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/ai-key')
        
        if (!res.ok) {
          throw new Error('Ошибка загрузки настроек OpenAI')
        }
        
        const data = await res.json()
        
        if (data.success) {
          setSettings({
            model: data.model || OpenAIModel.GPT3_5_TURBO,
            temperature: data.temperature || 0.7,
            maxTokens: data.maxTokens || 1500,
            maskedKey: data.hasKey ? data.maskedKey : null
          })
        }
      } catch (error) {
        console.error('Ошибка получения настроек OpenAI:', error)
        setError('Не удалось загрузить настройки OpenAI')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!apiKey) {
      setError('API-ключ не может быть пустым')
      return
    }
    
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/settings/ai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка сохранения настроек OpenAI')
      }
      
      // Сброс формы и отображение сообщения об успехе
      setApiKey('')
      setSuccess('Настройки OpenAI успешно сохранены')
      
      // Обновляем maskedKey
      const settingsRes = await fetch('/api/settings/ai-key')
      const settingsData = await settingsRes.json()
      
      if (settingsData.success) {
        setSettings(prev => ({
          ...prev,
          maskedKey: settingsData.maskedKey
        }))
      }
      
      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccess('')
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setSettings(prev => ({
      ...prev,
      temperature: value
    }))
  }

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setSettings(prev => ({
      ...prev,
      maxTokens: value
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Настройки OpenAI
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-primary-600 hover:text-primary-900"
        >
          {showSettings ? 'Скрыть настройки' : 'Настроить интеграцию'}
        </button>
      </div>
      
      {!showSettings ? (
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Статус</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {settings.maskedKey ? (
                  <span className="text-green-600">
                    Подключено к OpenAI (API ключ: {settings.maskedKey})
                  </span>
                ) : (
                  <span className="text-yellow-600">
                    Не настроено. Используется локальная логика.
                  </span>
                )}
              </dd>
            </div>
            
            {settings.maskedKey && (
              <>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Модель</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {settings.model}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Температура</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {settings.temperature}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Макс. токенов</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {settings.maxTokens}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      ) : (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                API-ключ OpenAI {settings.maskedKey && <span className="text-gray-500">(текущий: {settings.maskedKey})</span>}
              </label>
              <input
                type="password"
                id="api-key"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              <p className="mt-1 text-sm text-gray-500">
                Ключ OpenAI API для доступа к моделям. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-900">Получить в OpenAI</a>
              </p>
            </div>
            
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Модель
              </label>
              <select
                id="model"
                value={settings.model}
                onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value as OpenAIModel }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value={OpenAIModel.GPT3_5_TURBO}>GPT-3.5 Turbo (быстрее, дешевле)</option>
                <option value={OpenAIModel.GPT4}>GPT-4 (качественнее, дороже)</option>
                <option value={OpenAIModel.GPT4_TURBO}>GPT-4 Turbo (оптимальный баланс)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                Температура: {settings.temperature}
              </label>
              <input
                type="range"
                id="temperature"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={handleTemperatureChange}
                className="mt-1 block w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Контролирует случайность ответов. Низкие значения дают более предсказуемые ответы, высокие - более разнообразные.
              </p>
            </div>
            
            <div>
              <label htmlFor="max-tokens" className="block text-sm font-medium text-gray-700">
                Макс. токенов: {settings.maxTokens}
              </label>
              <input
                type="range"
                id="max-tokens"
                min="100"
                max="4000"
                step="100"
                value={settings.maxTokens}
                onChange={handleMaxTokensChange}
                className="mt-1 block w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Максимальное количество токенов для генерации. Более длинные ответы требуют больше токенов.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {submitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}