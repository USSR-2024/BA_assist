'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaFile, FaCheckSquare, FaRegComment, FaFileAlt } from 'react-icons/fa'
import { RoadmapPhase } from '@/app/contexts/InterviewContext'

interface Project {
  id: number
  title: string
  description: string | null
  status: string
  createdAt: string
  summary: string | null
  roadmap?: RoadmapPhase[] // Дорожная карта проекта
  users: {
    id: string
    email: string
    role: string
  }[]
  files: any[]
  tasks: any[]
  projectArtifacts?: any[]
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    files: 0,
    tasks: {
      total: 0,
      completed: 0
    },
    artifacts: {
      total: 0,
      completed: 0
    }
  })
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/projects/${params.id}`)
        
        if (!response.ok) {
          throw new Error(`Ошибка при загрузке проекта: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data && data.id) {
          setProject(data)
          
          // Статистика
          const completedTasks = data.tasks.filter((task: any) => task.status === 'DONE').length
          
          // Получаем артефакты проекта
          const artifactsResponse = await fetch(`/api/projects/${params.id}/artifacts`)
          let artifacts = []
          
          if (artifactsResponse.ok) {
            const artifactsData = await artifactsResponse.json()
            artifacts = artifactsData.data || []
            
            const completedArtifacts = artifacts.filter((artifact: any) => 
              artifact.status === 'APPROVED').length
            
            setStats({
              files: data.files.length,
              tasks: {
                total: data.tasks.length,
                completed: completedTasks
              },
              artifacts: {
                total: artifacts.length,
                completed: completedArtifacts
              }
            })
          } else {
            setStats({
              files: data.files.length,
              tasks: {
                total: data.tasks.length,
                completed: completedTasks
              },
              artifacts: {
                total: 0,
                completed: 0
              }
            })
          }
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
    
    fetchProject()
  }, [params.id])
  
  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  // Расчет процента выполнения
  const calculateProgress = (completed: number, total: number) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }
  
  // Определение общего прогресса проекта
  const getOverallProgress = () => {
    const taskProgress = calculateProgress(stats.tasks.completed, stats.tasks.total)
    const artifactProgress = calculateProgress(stats.artifacts.completed, stats.artifacts.total)
    
    // Если нет задач или артефактов, возвращаем 0
    if (stats.tasks.total === 0 && stats.artifacts.total === 0) return 0
    
    // Если есть только задачи или только артефакты, возвращаем их прогресс
    if (stats.tasks.total === 0) return artifactProgress
    if (stats.artifacts.total === 0) return taskProgress
    
    // Иначе рассчитываем средний прогресс
    return Math.round((taskProgress + artifactProgress) / 2)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Загрузка данных проекта...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Проект не найден</p>
        <Link href="/dashboard" className="mt-2 text-yellow-700 underline">
          Вернуться к списку проектов
        </Link>
      </div>
    )
  }

  const progress = getOverallProgress()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Основная информация о проекте */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">Обзор проекта</h2>
            
            {/* Прогресс проекта */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Общий прогресс</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-md font-medium mb-2">Описание</h3>
              {project.description ? (
                <p className="text-gray-700">{project.description}</p>
              ) : (
                <p className="text-gray-500 italic">Описание отсутствует</p>
              )}
            </div>
            
            {/* Саммари проекта */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Сводка проекта</h3>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/projects/${project.id}/summary`, {
                        method: 'POST'
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        // Обновляем локальное состояние проекта с новым саммари
                        setProject(prev => prev ? {...prev, summary: data.summary} : null);
                      } else {
                        console.error('Ошибка при обновлении сводки');
                      }
                    } catch (error) {
                      console.error('Ошибка при обновлении сводки:', error);
                    }
                  }}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Обновить сводку
                </button>
              </div>
              {project.summary ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{project.summary}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 italic">
                    Сводка еще не сгенерирована. Загрузите файлы и AI создаст сводку на основе их содержимого.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Кнопка генерации задач на основе дорожной карты */}
        {project.roadmap && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h3 className="text-md font-semibold mb-2">Опции искусственного интеллекта</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/ai/roadmap/tasks', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ 
                        projectId: project.id,
                        roadmap: project.roadmap
                      }),
                    });
                    
                    alert('Задачи успешно созданы на основе дорожной карты');
                    // Перезагружаем страницу
                    window.location.reload();
                  } catch (error) {
                    console.error('Ошибка при генерации задач:', error);
                    alert('Не удалось создать задачи. Пожалуйста, попробуйте еще раз.');
                  }
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-md text-sm font-medium"
              >
                Создать задачи из дорожной карты
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/ai/summary', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ projectId: project.id }),
                    });
                    
                    if (!response.ok) {
                      throw new Error('Ошибка при обновлении саммари');
                    }
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      // Обновляем локальное состояние
                      setProject(prev => prev ? {...prev, summary: data.data.summary} : null);
                    }
                  } catch (error) {
                    console.error('Ошибка при обновлении саммари:', error);
                    alert('Не удалось обновить сводку. Пожалуйста, попробуйте позже.');
                  }
                }}
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-md text-sm font-medium"
              >
                Обновить сводку проекта
              </button>
            </div>
          </div>
        )}
        
        {/* Секция быстрых действий */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Link href={`/dashboard/projects/${project.id}/files`}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaFile className="text-blue-600" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Файлы проекта</h3>
                <p className="text-gray-600 text-sm">Загружено файлов: {stats.files}</p>
              </div>
            </div>
            <div className="mt-2 text-blue-600 text-sm group-hover:underline">Перейти к файлам →</div>
          </Link>
          
          <Link href={`/dashboard/projects/${project.id}/tasks`}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheckSquare className="text-green-600" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Задачи проекта</h3>
                <p className="text-gray-600 text-sm">
                  Выполнено {stats.tasks.completed} из {stats.tasks.total} задач
                </p>
              </div>
            </div>
            <div className="mt-2 text-green-600 text-sm group-hover:underline">Перейти к задачам →</div>
          </Link>
          
          <Link href={`/dashboard/projects/${project.id}/chat`}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <FaRegComment className="text-purple-600" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Обсуждение</h3>
                <p className="text-gray-600 text-sm">Чат для обсуждения проекта</p>
              </div>
            </div>
            <div className="mt-2 text-purple-600 text-sm group-hover:underline">Перейти к чату →</div>
          </Link>
          
          <Link href={`/dashboard/projects/${project.id}/artifacts`}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="bg-amber-100 p-3 rounded-full">
                <FaFileAlt className="text-amber-600" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Артефакты</h3>
                <p className="text-gray-600 text-sm">
                  Утверждено {stats.artifacts.completed} из {stats.artifacts.total} артефактов
                </p>
              </div>
            </div>
            <div className="mt-2 text-amber-600 text-sm group-hover:underline">Перейти к артефактам →</div>
          </Link>
        </div>
      </div>
      
      {/* Боковая информационная карточка */}
      <div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Информация о проекте</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Статус</h3>
              <div className="mt-1">
                <span className={`px-2 py-1 text-sm rounded-full ${
                  project.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status === 'ACTIVE' ? 'Активный' : 'Архивный'}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Дата создания</h3>
              <p className="mt-1 text-sm">{formatDate(project.createdAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Участники ({project.users.length})</h3>
              <ul className="mt-1 text-sm space-y-1">
                {project.users.slice(0, 5).map(user => (
                  <li key={user.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{user.email}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {user.role === 'OWNER' ? 'Владелец' : 'Участник'}
                    </span>
                  </li>
                ))}
                {project.users.length > 5 && (
                  <li className="text-gray-500 text-sm">И еще {project.users.length - 5} участников</li>
                )}
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-500">Статистика</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Файлы</span>
                  <span className="text-sm font-medium">{stats.files}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Задачи</span>
                  <span className="text-sm font-medium">
                    {stats.tasks.completed}/{stats.tasks.total}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Артефакты</span>
                  <span className="text-sm font-medium">
                    {stats.artifacts.completed}/{stats.artifacts.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}