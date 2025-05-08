'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  role: string
}

interface TopNavBarProps {
  user?: User | null
  onLogout?: () => void
  showLogoutButton?: boolean
}

export default function TopNavBar({ user, onLogout, showLogoutButton = true }: TopNavBarProps) {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<User | null>(user || null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      setCurrentUser(user)
      return
    }

    // Если пользователь не передан через props, попробуем получить его из API
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        
        if (data.authenticated) {
          setCurrentUser(data.user)
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
      }
    }
    
    fetchUser()
  }, [user])

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
      return
    }

    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  // Определяем, является ли ссылка активной
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-primary-600">
                BA Assist
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`${isActive('/dashboard') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Проекты
              </Link>
              <Link
                href="/knowledge"
                className={`${isActive('/knowledge') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                База знаний
              </Link>
              <Link
                href="/knowledge/artifacts"
                className={`${isActive('/knowledge/artifacts') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Артефакты
              </Link>
              <Link
                href="/dashboard/troubleshoot"
                className={`${isActive('/dashboard/troubleshoot') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Диагностика
              </Link>
              {currentUser && currentUser.role === 'OWNER' && (
                <Link
                  href="/dashboard/admin"
                  className={`${isActive('/dashboard/admin') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Админ
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {currentUser && (
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <Link href="/profile" className="text-sm font-medium text-gray-500 hover:text-gray-700 mr-4">
                    {currentUser.email}
                  </Link>
                  {showLogoutButton && (
                    <button
                      onClick={handleLogout}
                      className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-600"
                    >
                      Выход
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Кнопка мобильного меню */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Открыть меню</span>
              {/* Иконка гамбургер-меню */}
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Иконка закрытия */}
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/dashboard"
            className={`${
              isActive('/dashboard')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Проекты
          </Link>
          <Link
            href="/knowledge"
            className={`${
              isActive('/knowledge')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            База знаний
          </Link>
          <Link
            href="/knowledge/artifacts"
            className={`${
              isActive('/knowledge/artifacts')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Артефакты
          </Link>
          <Link
            href="/dashboard/troubleshoot"
            className={`${
              isActive('/dashboard/troubleshoot')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Диагностика
          </Link>
          {currentUser && currentUser.role === 'OWNER' && (
            <Link
              href="/dashboard/admin"
              className={`${
                isActive('/dashboard/admin')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Админ-панель
            </Link>
          )}
        </div>
        {currentUser && (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{currentUser.email}</div>
                <div className="text-sm font-medium text-gray-500">{currentUser.role}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Профиль
              </Link>
              {showLogoutButton && (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Выход
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}