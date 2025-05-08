'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Отсутствует токен верификации')
      return
    }
    
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`)
        const data = await response.json()
        
        if (response.ok && data.success !== false) {
          // Успешная верификация
          setStatus('success')
          // Перенаправляем на страницу успешной верификации
          router.push('/auth/verification-success')
        } else {
          // Ошибка верификации
          setStatus('error')
          setMessage(data.message || 'Не удалось подтвердить email. Токен недействителен или истек.')
        }
      } catch (error) {
        console.error('Ошибка при верификации:', error)
        setStatus('error')
        setMessage('Ошибка при подтверждении email')
      }
    }
    
    verifyEmail()
  }, [token, router])
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <h2 className="mt-6 text-xl font-bold text-gray-900">Подтверждение email...</h2>
          <p className="mt-2 text-sm text-gray-600">
            Пожалуйста, подождите, пока мы проверяем ваш токен верификации.
          </p>
        </div>
      </div>
    )
  }
  
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Ошибка верификации</h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // Status === 'success' - но в этом случае должен уже произойти редирект
  return null
}