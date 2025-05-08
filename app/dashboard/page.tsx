'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

// Определим тип статуса проекта без прямого импорта из Prisma
type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

interface Project {
  id: number
  title: string
  description: string | null
  status: ProjectStatus
  createdAt: string
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | ProjectStatus>('ALL')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log("Начинаем запрос проектов...");
        const response = await fetch('/api/projects')
        
        if (!response.ok) {
          throw new Error(`Ошибка получения проектов: ${response.status}`)
        }
        
        // Логируем сырой ответ
        const rawData = await response.json()
        console.log("Сырой ответ API:", rawData);
        
        // Определяем формат данных и преобразуем
        let projectsData: Project[] = []
        
        if (Array.isArray(rawData)) {
          console.log("Данные в формате массива");
          projectsData = rawData;
        } else if (rawData && Array.isArray(rawData.projects)) {
          console.log("Данные в формате {projects: []}");
          projectsData = rawData.projects;
        } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
          console.log("Данные в формате одного объекта");
          // Проверим, является ли объект проектом
          if (rawData.id !== undefined) {
            projectsData = [rawData];
          } else {
            // Попробуем найти проекты в свойствах объекта
            Object.keys(rawData).forEach(key => {
              if (Array.isArray(rawData[key])) {
                console.log(`Найден массив в свойстве ${key}`);
                projectsData = rawData[key];
              }
            });
          }
        }
        
        console.log('Преобразованные проекты:', projectsData);
        
        if (projectsData.length === 0) {
          console.log("ВНИМАНИЕ: Массив проектов пуст после преобразования!");
        }
        
        setProjects(projectsData);
      } catch (err: any) {
        console.error('Ошибка загрузки проектов:', err)
        setError(`Не удалось загрузить проекты: ${err.message || 'Неизвестная ошибка'}`)
        setProjects([]) // Устанавливаем пустой массив при ошибке
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Дополнительная проверка после установки состояния
  useEffect(() => {
    console.log("Состояние projects обновлено:", projects);
    console.log("Текущий фильтр:", filter);
  }, [projects, filter]);

  const filteredProjects = projects && Array.isArray(projects) 
    ? projects.filter(project => {
        console.log(`Проверка проекта ${project.id}, статус: ${project.status}, фильтр: ${filter}`);
        if (filter === 'ALL') return true
        return project.status === filter
      })
    : [];
    
  console.log("Отфильтрованные проекты:", filteredProjects);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои проекты</h1>
        <Link 
          href="/dashboard/projects/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          + Новый проект
        </Link>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md ${filter === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('ALL')}
          >
            Все
          </button>
          <button
            className={`px-3 py-1 rounded-md ${filter === 'ACTIVE' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('ACTIVE')}
          >
            Активные
          </button>
          <button
            className={`px-3 py-1 rounded-md ${filter === 'ARCHIVED' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('ARCHIVED')}
          >
            Архивные
          </button>
        </div>
      </div>

      {/* Отладочная информация */}
      <div className="mb-4 p-2 bg-gray-100 text-xs">
        <p>Всего проектов: {projects.length}</p>
        <p>Отфильтровано: {filteredProjects.length}</p>
        <p>Текущий фильтр: {filter}</p>
        <p>Загрузка: {isLoading ? 'Да' : 'Нет'}</p>
        <p>Ошибка: {error || 'Нет'}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Повторить
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Проектов пока нет</h3>
          <p className="text-gray-600 mb-4">Создайте свой первый проект, нажав кнопку выше</p>
          <Link 
            href="/dashboard/projects/new" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            + Создать проект
          </Link>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Нет проектов с выбранным фильтром</h3>
          <p className="text-gray-600 mb-4">Измените фильтр, чтобы увидеть другие проекты</p>
          <button
            onClick={() => setFilter('ALL')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Показать все проекты
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Link 
              href={`/dashboard/projects/${project.id}`} 
              key={project.id}
              className="block border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <h2 className="text-lg font-semibold mb-2">{project.title}</h2>
              {project.description && (
                <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status === 'ACTIVE' ? 'Активный' : 'Архивный'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}