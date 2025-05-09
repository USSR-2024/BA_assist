// Обновляем файл app/dashboard/projects/[id]/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import InviteUserModal from '@/app/components/modals/InviteUserModal'
import ProjectManageModal from '@/app/components/modals/ProjectManageModal'

interface Project {
  id: number
  title: string
  description: string | null
  status: string
  summary: string | null
}

export default function ProjectLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode 
  params: { id: string } 
}) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const pathname = usePathname()
  
  const projectId = params.id
  
  // Проверяем корректность ID проекта
  useEffect(() => {
    if (projectId === 'undefined' || !projectId) {
      console.error('Обнаружен некорректный ID проекта:', projectId);
      setError('Некорректный ID проекта. Возвращаемся к списку проектов.')
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      return;
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/projects/${projectId}`)
        
        if (!response.ok) {
          throw new Error(`Ошибка при загрузке проекта: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Обработка разных форматов ответа
        if (data && data.id) {
          setProject(data)
        } else if (data && data.project && data.project.id) {
          setProject(data.project)
        } else {
          throw new Error('Получены некорректные данные проекта')
        }
      } catch (err) {
        console.error('Ошибка загрузки проекта:', err)
        setError('Не удалось загрузить данные проекта. Пожалуйста, попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }
    
    if (projectId) {
      fetchProject()
    }
  }, [projectId])
  
  const getActiveTab = () => {
    if (pathname.includes('/files')) return 'files'
    if (pathname.includes('/chat')) return 'chat'
    if (pathname.includes('/tasks')) return 'tasks'
    if (pathname.includes('/artifacts')) return 'artifacts'
    if (pathname.includes('/roadmap')) return 'roadmap'
    if (pathname.includes('/frameworks')) return 'frameworks'
    // Точное совпадение пути с /dashboard/projects/{id} означает страницу обзора
    if (pathname === `/dashboard/projects/${projectId}`) return 'overview'
    return 'overview'
  }
  
  const activeTab = getActiveTab()
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Загрузка проекта...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
        <p>{error}</p>
        <div className="mt-2">
          <Link href="/dashboard" className="text-red-700 underline">
            Вернуться к списку проектов
          </Link>
          <button 
            onClick={() => window.location.reload()} 
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded-md"
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded m-4">
        <p>Проект не найден</p>
        <Link href="/dashboard" className="mt-2 text-yellow-700 underline">
          Вернуться к списку проектов
        </Link>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-grow">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{project.title}</h1>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  project.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : project.status === 'CLOSED'
                    ? 'bg-yellow-100 text-yellow-800'
                    : project.status === 'DELETED'
                    ? 'bg-red-100 text-red-800'
                    : project.status === 'ARCHIVED'
                    ? 'bg-yellow-100 text-yellow-800' // Display ARCHIVED as closed for now
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status === 'ACTIVE'
                    ? 'Активный'
                    : project.status === 'CLOSED'
                    ? 'Закрытый'
                    : project.status === 'DELETED'
                    ? 'Удаленный'
                    : project.status === 'ARCHIVED'
                    ? 'Закрытый' // Display ARCHIVED as closed for now
                    : 'Архивный'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                  >
                    Пригласить участника
                  </button>
                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded-md text-sm"
                  >
                    Управление
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 border-b">
              <nav className="flex -mb-px">
                <Link 
                  href={`/dashboard/projects/${projectId}`}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'overview' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Обзор
                </Link>
                <Link 
                  href={`/dashboard/projects/${projectId}/files`}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'files' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Файлы
                </Link>
                <Link 
                  href={`/dashboard/projects/${projectId}/chat`}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'chat' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Чат
                </Link>
                <Link 
                  href={`/dashboard/projects/${projectId}/tasks`}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'tasks' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Задачи
                </Link>
                <Link
                  href={`/dashboard/projects/${projectId}/artifacts`}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'artifacts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Артефакты
                </Link>
                <Link
                  href={`/dashboard/projects/${projectId}/roadmap`}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'roadmap'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Дорожная карта
                </Link>
                <Link
                  href={`/dashboard/projects/${projectId}/frameworks`}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'frameworks'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Фреймворки
                </Link>
              </nav>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-4">
          {children}
        </div>
      </div>
      
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-gray-50 p-4">
        <h3 className="text-lg font-semibold mb-2">Сводка проекта</h3>
        {project.summary ? (
          <p className="text-gray-700 whitespace-pre-line">{project.summary}</p>
        ) : (
          <p className="text-gray-500 italic">Сводка еще не сгенерирована</p>
        )}
      </div>
      
      {/* Модальное окно для приглашения пользователей */}
      {isInviteModalOpen && (
        <InviteUserModal
          projectId={Number(projectId)}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {/* Модальное окно для управления проектом */}
      {isManageModalOpen && project && (
        <ProjectManageModal
          project={project}
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
        />
      )}
    </div>
  )
}