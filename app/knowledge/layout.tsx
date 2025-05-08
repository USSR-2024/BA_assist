'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopNavBar from '../components/navigation/TopNavBar'

interface User {
  id: string
  email: string
  role: string
}

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        
        if (data.authenticated) {
          setUser(data.user)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя панель навигации */}
      <TopNavBar user={user} onLogout={handleLogout} />

      {/* Основное содержимое */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}