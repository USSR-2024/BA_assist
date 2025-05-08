'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Типы данных для бизнес-процессов
interface ProcessNode {
  id: string
  title: string
  children?: ProcessNode[]
}

// Типы данных для глоссария
interface GlossaryTerm {
  id: number
  term: string
  definition: string
}

// Тип для результатов поиска
interface SearchResult {
  id: number
  fileId: number
  fileName: string
  excerpt: string
  projectId: number
  projectTitle: string
}

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<'search' | 'processes' | 'glossary'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [processList, setProcessList] = useState<ProcessNode[]>([])
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
  const [newTerm, setNewTerm] = useState('')
  const [newDefinition, setNewDefinition] = useState('')
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null)
  const [showTermModal, setShowTermModal] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null)

  useEffect(() => {
    // Загрузка списка бизнес-процессов (статический JSON для MVP-Lite)
    const loadProcesses = () => {
      // Временный статический JSON для MVP-Lite
      const dummyProcesses: ProcessNode[] = [
        {
          id: 'bp1',
          title: 'Работа с клиентами',
          children: [
            { id: 'bp1.1', title: 'Привлечение клиентов' },
            { id: 'bp1.2', title: 'Онбординг клиентов' },
            { id: 'bp1.3', title: 'Поддержка клиентов' }
          ]
        },
        {
          id: 'bp2',
          title: 'Разработка продукта',
          children: [
            { id: 'bp2.1', title: 'Сбор требований' },
            { id: 'bp2.2', title: 'Проектирование' },
            { id: 'bp2.3', title: 'Разработка' },
            { id: 'bp2.4', title: 'Тестирование' },
            { id: 'bp2.5', title: 'Релиз' }
          ]
        },
        {
          id: 'bp3',
          title: 'Финансы и юридические вопросы',
          children: [
            { id: 'bp3.1', title: 'Бюджетирование' },
            { id: 'bp3.2', title: 'Отчетность' },
            { id: 'bp3.3', title: 'Контракты' }
          ]
        }
      ]
      
      setProcessList(dummyProcesses)
    }

    // Загрузка глоссария
    const loadGlossary = async () => {
      try {
        const res = await fetch('/api/glossary')
        if (!res.ok) {
          throw new Error('Ошибка загрузки глоссария')
        }
        
        const data = await res.json()
        setGlossaryTerms(data.terms)
      } catch (error) {
        console.error('Ошибка при загрузке глоссария:', error)
      }
    }

    loadProcesses()
    loadGlossary()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setSearching(true)
    setSearchResults([])
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      
      if (!res.ok) {
        throw new Error('Ошибка выполнения поиска')
      }
      
      const data = await res.json()
      setSearchResults(data.results)
    } catch (error) {
      console.error('Ошибка поиска:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTerm.trim() || !newDefinition.trim()) return
    
    try {
      const res = await fetch('/api/glossary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: newTerm,
          definition: newDefinition
        }),
      })
      
      if (!res.ok) {
        throw new Error('Ошибка добавления термина')
      }
      
      const data = await res.json()
      
      // Обновляем список терминов
      setGlossaryTerms([...glossaryTerms, data.term])
      
      // Сбрасываем форму
      setNewTerm('')
      setNewDefinition('')
    } catch (error) {
      console.error('Ошибка при добавлении термина:', error)
      alert('Не удалось добавить термин')
    }
  }

  const handleEditTerm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingTerm || !editingTerm.term.trim() || !editingTerm.definition.trim()) return
    
    try {
      const res = await fetch(`/api/glossary/${editingTerm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: editingTerm.term,
          definition: editingTerm.definition
        }),
      })
      
      if (!res.ok) {
        throw new Error('Ошибка обновления термина')
      }
      
      // Обновляем список терминов
      setGlossaryTerms(glossaryTerms.map(t => 
        t.id === editingTerm.id ? editingTerm : t
      ))
      
      // Завершаем редактирование
      setEditingTerm(null)
    } catch (error) {
      console.error('Ошибка при обновлении термина:', error)
      alert('Не удалось обновить термин')
    }
  }

  const handleDeleteTerm = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот термин?')) return
    
    try {
      const res = await fetch(`/api/glossary/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Ошибка удаления термина')
      }
      
      // Обновляем список терминов
      setGlossaryTerms(glossaryTerms.filter(t => t.id !== id))
    } catch (error) {
      console.error('Ошибка при удалении термина:', error)
      alert('Не удалось удалить термин')
    }
  }

  const openTermModal = (term: GlossaryTerm) => {
    setSelectedTerm(term)
    setShowTermModal(true)
  }

  const renderProcessTree = (nodes: ProcessNode[], level = 0) => {
    return (
      <ul className={`pl-${level * 4}`}>
        {nodes.map(node => (
          <li key={node.id} className="mb-2">
            <div className="flex items-center">
              <span className="font-medium">{node.title}</span>
            </div>
            {node.children && node.children.length > 0 && (
              <div className="ml-4 mt-2">
                {renderProcessTree(node.children, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">База знаний</h1>
      
      <div className="tabs mb-6">
        <button
          className={`mr-4 pb-2 ${activeTab === 'search' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('search')}
        >
          Поиск
        </button>
        <button
          className={`mr-4 pb-2 ${activeTab === 'processes' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('processes')}
        >
          Бизнес-процессы
        </button>
        <button
          className={`pb-2 ${activeTab === 'glossary' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('glossary')}
        >
          Глоссарий
        </button>
      </div>
      
      {activeTab === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск в файлах проектов..."
                className="flex-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {searching ? 'Поиск...' : 'Искать'}
              </button>
            </div>
          </form>
          
          {searching ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div>
              {searchResults.length === 0 ? (
                searchQuery.trim() ? (
                  <div className="text-center py-8 text-gray-500">
                    По вашему запросу ничего не найдено. Попробуйте изменить поисковый запрос.
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Введите поисковый запрос для поиска в файлах проектов.
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  {searchResults.map((result) => (
                    <div key={result.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {result.fileName}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Проект: {result.projectTitle}
                        </p>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        <p className="text-gray-900">{result.excerpt}</p>
                        <div className="mt-4">
                          <Link 
                            href={`/dashboard/projects/${result.projectId}/files`} 
                            className="text-primary-600 hover:text-primary-500"
                          >
                            Перейти к файлу
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'processes' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Бизнес-процессы компании
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Структура основных бизнес-процессов
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {renderProcessTree(processList)}
          </div>
        </div>
      )}
      
      {activeTab === 'glossary' && (
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Глоссарий
              </h3>
              <button
                onClick={() => setShowTermModal(true)}
                className="btn btn-sm"
              >
                + Добавить термин
              </button>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                {glossaryTerms.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Пока нет добавленных терминов. Добавьте первый термин.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {glossaryTerms.map((term) => (
                      <div 
                        key={term.id} 
                        className="border border-gray-200 rounded p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => openTermModal(term)}
                      >
                        <h4 className="font-medium text-gray-900">{term.term}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {term.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Форма для добавления термина */}
          {editingTerm && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Редактирование термина
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <form onSubmit={handleEditTerm}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="term-edit" className="block text-sm font-medium text-gray-700">
                        Термин
                      </label>
                      <input
                        type="text"
                        id="term-edit"
                        value={editingTerm.term}
                        onChange={(e) => setEditingTerm({...editingTerm, term: e.target.value})}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="definition-edit" className="block text-sm font-medium text-gray-700">
                        Определение
                      </label>
                      <textarea
                        id="definition-edit"
                        value={editingTerm.definition}
                        onChange={(e) => setEditingTerm({...editingTerm, definition: e.target.value})}
                        rows={4}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setEditingTerm(null)}
                        className="btn-secondary"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="btn"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Модальное окно для просмотра термина */}
      {showTermModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            {selectedTerm ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedTerm.term}
                  </h3>
                  <button
                    onClick={() => setShowTermModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="prose prose-sm max-w-none mb-4">
                  {selectedTerm.definition}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setEditingTerm(selectedTerm)
                      setShowTermModal(false)
                    }}
                    className="btn-secondary"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteTerm(selectedTerm.id)
                      setShowTermModal(false)
                    }}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Добавить новый термин
                  </h3>
                  <button
                    onClick={() => setShowTermModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddTerm}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="new-term" className="block text-sm font-medium text-gray-700">
                        Термин
                      </label>
                      <input
                        type="text"
                        id="new-term"
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="new-definition" className="block text-sm font-medium text-gray-700">
                        Определение
                      </label>
                      <textarea
                        id="new-definition"
                        value={newDefinition}
                        onChange={(e) => setNewDefinition(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn"
                        disabled={!newTerm.trim() || !newDefinition.trim()}
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
