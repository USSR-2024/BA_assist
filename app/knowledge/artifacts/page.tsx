'use client'

import { useState, useEffect } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ArtifactsCatalog')

interface ArtifactType {
  id: string
  enName: string
  ruName: string
  babokArea: string
  stage: string
  description: string
  minInputs?: string
  format: string
  doneCriteria: string
  keywords: string[]
  dependsOn?: string
  providesFor?: string
}

export default function ArtifactsCatalogPage() {
  const [artifacts, setArtifacts] = useState<ArtifactType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactType | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  useEffect(() => {
    fetchArtifacts()
  }, [filter])
  
  const fetchArtifacts = async () => {
    try {
      setLoading(true)
      
      // Формируем URL с учетом фильтра
      let url = '/api/artifacts/catalog'
      if (filter) {
        url += `?babokArea=${encodeURIComponent(filter)}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить каталог артефактов')
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
      logger.error('Ошибка при загрузке каталога артефактов:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }
  
  const openArtifactDetails = (artifact: ArtifactType) => {
    setSelectedArtifact(artifact)
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setSelectedArtifact(null)
  }
  
  // Фильтрация артефактов по поисковому запросу
  const filteredArtifacts = artifacts.filter(artifact => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      artifact.id.toLowerCase().includes(searchLower) ||
      artifact.enName.toLowerCase().includes(searchLower) ||
      artifact.ruName.toLowerCase().includes(searchLower) ||
      artifact.description.toLowerCase().includes(searchLower) ||
      artifact.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
    )
  })
  
  // Группировка по babokArea
  const areas = [...new Set(artifacts.map(a => a.babokArea))].sort()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Каталог артефактов бизнес-анализа</h1>
      
      <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
        <div className="w-full md:w-3/4 mb-4 md:mb-0">
          <input
            type="text"
            placeholder="Поиск артефактов..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={handleSearch}
          />
        </div>
        
        <div className="w-full md:w-1/4">
          <select
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter || ''}
            onChange={e => setFilter(e.target.value || null)}
          >
            <option value="">Все области</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
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
      
      {/* Таблица артефактов */}
      {!loading && filteredArtifacts.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Артефакты не найдены</h3>
          <p className="text-gray-600">
            Попробуйте изменить параметры поиска или фильтрации.
          </p>
        </div>
      )}
      
      {!loading && filteredArtifacts.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Область
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Этап
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Формат
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArtifacts.map((artifact) => (
                <tr 
                  key={artifact.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openArtifactDetails(artifact)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {artifact.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{artifact.ruName}</div>
                    <div className="text-sm text-gray-500">{artifact.enName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {artifact.babokArea}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {artifact.stage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {artifact.format}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Модальное окно с деталями артефакта */}
      {showModal && selectedArtifact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedArtifact.ruName}</h2>
                  <p className="text-gray-500">{selectedArtifact.enName} ({selectedArtifact.id})</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Описание</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedArtifact.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Область BABOK</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedArtifact.babokArea}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Стадия</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedArtifact.stage}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Формат</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedArtifact.format}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Минимальные входные данные</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedArtifact.minInputs || "Не указаны"}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Критерии завершения</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedArtifact.doneCriteria}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ключевые слова</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedArtifact.keywords.map(keyword => (
                      <span 
                        key={keyword} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                {(selectedArtifact.dependsOn || selectedArtifact.providesFor) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedArtifact.dependsOn && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Зависит от</h3>
                        <p className="mt-1 text-sm text-gray-900">{selectedArtifact.dependsOn}</p>
                      </div>
                    )}
                    
                    {selectedArtifact.providesFor && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Предоставляет данные для</h3>
                        <p className="mt-1 text-sm text-gray-900">{selectedArtifact.providesFor}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}