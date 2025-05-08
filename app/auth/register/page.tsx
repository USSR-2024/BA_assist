'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get('token')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [isFirstUser, setIsFirstUser] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Проверка, является ли это первым пользователем в системе
  useEffect(() => {
    const checkIfFirstUser = async () => {
      try {
        const response = await fetch('/api/auth/first-user', {
          method: 'GET'
        })
        const data = await response.json()
        
        if (response.ok && data.isFirstUser) {
          setIsFirstUser(true)
          setRole('OWNER') // Если первый пользователь, по умолчанию OWNER
        }
        
        // Если пришли с токеном приглашения, заблокируем изменение роли
        if (invitationToken) {
          setRole('MEMBER')
        }
      } catch (err) {
        console.error('Ошибка при проверке первого пользователя:', err)
      }
    }
    
    checkIfFirstUser()
  }, [invitationToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    try {
      const registerData: any = { 
        email, 
        password,
        role
      }
      
      // Если есть токен приглашения, добавляем его
      if (invitationToken) {
        registerData.invitationToken = invitationToken
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации')
      }

      // Формируем сообщение в зависимости от роли и приглашения
      let successMessage = 'Регистрация успешна! Проверьте вашу почту для подтверждения аккаунта.';
      
      if (data.role === 'OWNER') {
        successMessage += ' Вы зарегистрированы как владелец системы.';
      } else if (data.invited && data.projectId) {
        successMessage += ' Вы были приглашены в проект и будете добавлены автоматически после подтверждения.';
      }
      
      setMessage(successMessage);
      
      // Перенаправление на страницу входа после задержки
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
            Регистрация
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Подтвердите пароль
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            {/* Выбор роли (отображается только если это первый пользователь и нет токена приглашения) */}
            {isFirstUser && !invitationToken && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип пользователя
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="role-owner"
                      name="role"
                      type="radio"
                      value="OWNER"
                      checked={role === 'OWNER'}
                      onChange={() => setRole('OWNER')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="role-owner" className="ml-2 block text-sm text-gray-700">
                      Владелец
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="role-member"
                      name="role"
                      type="radio"
                      value="MEMBER"
                      checked={role === 'MEMBER'}
                      onChange={() => setRole('MEMBER')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="role-member" className="ml-2 block text-sm text-gray-700">
                      Участник
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Информация о регистрации по приглашению */}
            {invitationToken && (
              <div className="mt-4 bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  Вы регистрируетесь по приглашению. Вам будет присвоена роль участника проекта.
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Загрузка...' : 'Зарегистрироваться'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-500">
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
