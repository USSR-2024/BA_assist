'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Проверяем авторизацию
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        
        if (data.authenticated) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          BA Assist
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8">
          Ваш интеллектуальный помощник для бизнес-анализа
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link href="/auth/login" className="btn text-center">
            Войти
          </Link>
          <Link href="/auth/register" className="btn-secondary text-center">
            Зарегистрироваться
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Управление проектами</h2>
            <p className="text-gray-600">Создавайте проекты, приглашайте участников, отслеживайте задачи</p>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Анализ документов</h2>
            <p className="text-gray-600">Загружайте файлы, получайте структурированные данные</p>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">База знаний</h2>
            <p className="text-gray-600">Храните и организуйте бизнес-знания вашей компании</p>
          </div>
        </div>
      </div>
    </div>
  )
}
