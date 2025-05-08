'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  // Проверяем валидность токена
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        setError('Отсутствует токен сброса пароля')
        return
      }

      try {
        const response = await fetch(`/api/auth/reset-password/validate?token=${token}`)
        
        if (!response.ok) {
          setTokenValid(false)
          const data = await response.json()
          setError(data.message || 'Недействительный или истекший токен')
        }
      } catch (err) {
        setTokenValid(false)
        setError('Ошибка проверки токена')
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Проверка совпадения паролей
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    // Проверка на сложность пароля (минимум 8 символов)
    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка сброса пароля')
      }

      setSuccess(true)
      
      // Редирект на страницу входа через 3 секунды
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Сброс пароля
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">Ваш пароль успешно изменен!</p>
            <p className="block sm:inline">Вы будете перенаправлены на страницу входа.</p>
            <div className="mt-4 text-center">
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-500">
                Перейти на страницу входа сейчас
              </Link>
            </div>
          </div>
        ) : tokenValid ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Новый пароль
                </label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Введите новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Подтвердите пароль
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Подтвердите новый пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-500">
                Вернуться на страницу входа
              </Link>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              Недействительный или истекший токен сброса пароля. Пожалуйста, запросите новую ссылку для сброса пароля.
            </p>
            <Link 
              href="/auth/forgot-password" 
              className="text-primary-600 hover:text-primary-500"
            >
              Запросить новую ссылку
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
