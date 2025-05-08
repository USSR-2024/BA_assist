'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ProjectArtifacts')

interface Artifact {
  id: string
  status: string
  version: number
  stage: string
  format: string
  createdAt: string
  updatedAt: string
  artifact: {
    id: string
    enName: string
    ruName: string
    babokArea: string
    stage: string
    description: string
  }
  file?: {
    id: number
    name: string
    size: number
    uploadedAt: string
  } | null
}

export default function ProjectArtifactsPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  
  useEffect(() => {
    fetchArtifacts()
  }, [projectId, filter])
  
  const fetchArtifacts = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      
      // Формируем URL с учетом фильтра
      let url = `/api/projects/${projectId}/artifacts`
      if (filter) {
        url += `?stage=${filter}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить артефакты проекта')
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setArtifacts(data.data)
      } else {
        setArtifacts([])
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      logger.error('Ошибка при загрузке артефактов:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800'
      case 'DRAFT':
        return 'bg-blue-100 text-blue-800'
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'OBSOLETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Не начат'
      case 'DRAFT':
        return 'Черновик'
      case 'IN_REVIEW':
        return 'На проверке'
      case 'APPROVED':
        return 'Утвержден'
      case 'OBSOLETE':
        return 'Устарел'
      default:
        return status
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  
  const getStageName = (stage: string) => {
    switch (stage) {
      case 'INITIATION_DISCOVERY':
        return 'Инициация / Исследование'
      case 'ANALYSIS_MODELING':
        return 'Анализ и моделирование'
      case 'SOLUTION_DESIGN_PLANNING':
        return 'Проектирование решения'
      case 'MONITORING_EVALUATION':
        return 'Мониторинг и оценка'
      default:
        return stage
    }
  }
  
  const stages = [
    { id: 'INITIATION_DISCOVERY', name: 'Инициация / Исследование' },
    { id: 'ANALYSIS_MODELING', name: 'Анализ и моделирование' },
    { id: 'SOLUTION_DESIGN_PLANNING', name: 'Проектирование решения' },
    { id: 'MONITORING_EVALUATION', name: 'Мониторинг и оценка' }
  ]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Артефакты проекта</h1>
        <Link 
          href={`/knowledge/artifacts`}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Просмотреть каталог артефактов
        </Link>
      </div>
      
      {/* Фильтр по стадиям */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded-md ${filter === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter(null)}
          >
            Все стадии
          </button>
          {stages.map(stage => (
            <button
              key={stage.id}
              className={`px-3 py-1 rounded-md ${filter === stage.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter(stage.id)}
            >
              {stage.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Индикатор загрузки */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Список артефактов */}
      {!loading && artifacts.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Артефактов пока нет</h3>
          <p className="text-gray-600">
            Загрузите файлы проекта, и система автоматически классифицирует их как артефакты.
          </p>
        </div>
      )}
      
      {!loading && artifacts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Артефакт
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Стадия
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Файл
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Версия
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Обновлен
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {artifacts.map((artifact) => (
                <tr key={artifact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {artifact.artifact.ruName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {artifact.artifact.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getStageName(artifact.stage)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {artifact.artifact.babokArea}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(artifact.status)}`}>
                      {getStatusLabel(artifact.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {artifact.file ? (
                      <div>
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {artifact.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(artifact.file.uploadedAt)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Нет файла</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    v{artifact.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(artifact.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}