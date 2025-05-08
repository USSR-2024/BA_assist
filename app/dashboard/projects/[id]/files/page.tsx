'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createLogger } from '@/lib/logger'

// Создаем логгер для компонента
const logger = createLogger('ProjectFiles')

interface File {
  id: number
  name: string
  size: number
  status: 'UPLOADED' | 'PARSED'
  uploadedAt: string
  gcsPath: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  warning?: string
  message?: string
}

export default function ProjectFiles() {
  // Используем useParams для получения параметров в клиентском компоненте
  const params = useParams<{ id: string }>()
  const projectId = params.id
  
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [uploading, setUploading] = useState(false)
  const [processingFileId, setProcessingFileId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (projectId) {
      fetchFiles()
    }
  }, [projectId])

  // Загрузка списка файлов проекта
  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError('')
      setWarning('')
      
      logger.info(`Загрузка файлов для проекта ${projectId}`)
      const res = await fetch(`/api/projects/${projectId}/files`)
      
      if (!res.ok) {
        throw new Error('Ошибка загрузки файлов')
      }
      
      const data = await res.json() as ApiResponse<{ files: File[] }>
      
      if (data.success && data.data?.files) {
        setFiles(data.data.files)
        logger.info(`Загружено ${data.data.files.length} файлов`)
      } else if (data.data?.files) {
        setFiles(data.data.files)
        logger.info(`Загружено ${data.data.files.length} файлов`)
      } else if (Array.isArray(data.data)) {
        setFiles(data.data)
        logger.info(`Загружено ${data.data.length} файлов`)
      } else if (Array.isArray(data)) {
        setFiles(data)
        logger.info(`Загружено ${data.length} файлов`)
      } else if (data.files && Array.isArray(data.files)) {
        setFiles(data.files)
        logger.info(`Загружено ${data.files.length} файлов`)
      } else {
        // Если формат ответа не соответствует ожидаемым, устанавливаем пустой массив
        setFiles([])
        logger.warn('Получен неожиданный формат ответа API:', data)
        
        if (data.warning) {
          setWarning(data.warning)
        }
      }
    } catch (error) {
      logger.error('Ошибка получения файлов:', error)
      setError('Не удалось загрузить файлы. Пожалуйста, попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  // Обработчик загрузки файла
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    setWarning('')
    
    try {
      const formData = new FormData()
      formData.append('projectId', projectId)
      
      // Загружаем только первый файл для начала (чтобы упростить отладку)
      const fileToUpload = files[0]
      formData.append('file', fileToUpload)
      
      logger.info(`Отправка запроса на загрузку файла: ${fileToUpload.name} (${fileToUpload.size} байт)`)
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json() as ApiResponse<{ fileId: number }>
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки файлов')
      }
      
      logger.info('Ответ сервера:', data)
      
      if (data.warning) {
        setWarning(data.warning)
      }
      
      if (data.message) {
        // Можно показать сообщение об успехе, если необходимо
      }
      
      // Обновляем список файлов
      fetchFiles()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      logger.error('Ошибка загрузки файлов:', error)
      setError(`Не удалось загрузить файлы: ${errorMessage}`)
    } finally {
      setUploading(false)
      // Сбрасываем значение поля выбора файла
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Обработчик обработки файла
  const processFile = async (fileId: number) => {
    setProcessingFileId(fileId)
    setError('')
    setWarning('')
    
    try {
      logger.info(`Отправка запроса на обработку файла: ${fileId}`)
      
      const res = await fetch(`/api/files/${fileId}/process`, {
        method: 'POST',
      })
      
      const data = await res.json() as ApiResponse<{ fileId: number }>
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обработки файла')
      }
      
      logger.info('Файл успешно обработан:', data)
      
      if (data.warning) {
        setWarning(data.warning)
      }
      
      // Обновляем список файлов
      fetchFiles()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      logger.error('Ошибка обработки файла:', error)
      setError(`Не удалось обработать файл: ${errorMessage}`)
    } finally {
      setProcessingFileId(null)
    }
  }

  // Форматирование размера файла для отображения
  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B'
    else if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
    else return (size / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Отображение в состоянии загрузки
  if (loading && files.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Заголовок и кнопка загрузки */}
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Файлы проекта</h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className={`btn cursor-pointer ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {uploading ? 'Загрузка...' : 'Загрузить файлы'}
          </label>
        </div>
      </div>
      
      {/* Сообщение об ошибке */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Предупреждение */}
      {warning && (
        <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{warning}</span>
        </div>
      )}
      
      {/* Индикатор загрузки при обновлении списка файлов */}
      {loading && files.length > 0 && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mr-2"></div>
          <span className="text-sm text-gray-500">Обновление списка файлов...</span>
        </div>
      )}

      {/* Список файлов или сообщение, если файлов нет */}
      {files.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-gray-500">У этого проекта пока нет файлов. Загрузите первый файл.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя файла
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Размер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Загружен
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {file.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      file.status === 'PARSED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {file.status === 'PARSED' ? 'Обработан' : 'Загружен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.uploadedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {file.status === 'UPLOADED' && (
                      <button
                        onClick={() => processFile(file.id)}
                        disabled={processingFileId === file.id}
                        className="text-primary-600 hover:text-primary-900 disabled:text-gray-400 disabled:hover:text-gray-400"
                      >
                        {processingFileId === file.id ? 'Обработка...' : 'Обработать'}
                      </button>
                    )}
                    {file.status === 'PARSED' && (
                      <span className="text-gray-400">Обработан</span>
                    )}
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