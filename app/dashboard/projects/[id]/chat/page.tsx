'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

interface ChatMessage {
  id: string
  content: string
  userId: string
  timestamp: string
  userName?: string // This would be useful to display, but not in our schema yet
}

export default function ProjectChat() {
  // Используем useParams для получения параметров в клиентском компоненте
  const params = useParams()
  const projectId = params.id
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectId) {
      fetchMessages()
    }
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`)
      
      if (!res.ok) {
        throw new Error('Ошибка загрузки сообщений')
      }
      
      const data = await res.json()
      setMessages(data.messages)
    } catch (error) {
      console.error('Ошибка получения сообщений:', error)
      setError('Не удалось загрузить сообщения')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    
    setSending(true)
    
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      })
      
      if (!res.ok) {
        throw new Error('Ошибка отправки сообщения')
      }
      
      // Clear the input
      setNewMessage('')
      
      // Refresh messages
      fetchMessages()
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      alert('Не удалось отправить сообщение')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-t-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">В этом чате пока нет сообщений. Начните обсуждение!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">
                    {/* Here could display userName if available */}
                    {new Date(message.timestamp).toLocaleString()}
                  </div>
                  <div className="text-gray-900">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="flex items-center p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
          className="flex-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="ml-3 btn"
        >
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  )
}