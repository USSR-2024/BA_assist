'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhaseList, { ProjectPhaseProps } from '@/app/components/roadmap/PhaseList';
import TaskCard, { TaskCardProps } from '@/app/components/roadmap/TaskCard';

interface TaskArtifactLink {
  id: string;
  artifact: {
    id: string;
    name: string;
  };
}

interface ProjectTask {
  id: string;
  name: string;
  ruName?: string;
  description?: string;
  ruDescription?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: number;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  assignedToUserId?: string;
  artifactLinks?: TaskArtifactLink[];
}

interface ProjectPhase {
  id: string;
  name: string;
  ruName?: string;
  order: number;
  startDate?: string;
  endDate?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress: number;
  tasks: ProjectTask[];
}

interface ProjectRoadmap {
  id: string;
  name?: string;
  description?: string;
  frameworkId: string;
  framework: {
    id: string;
    name: string;
    ruName: string;
  };
  isActive: boolean;
  createdAt: string;
  phases: ProjectPhase[];
}

export default function RoadmapPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null);
  const [hasRoadmap, setHasRoadmap] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const router = useRouter();
  const projectId = parseInt(params.id, 10);
  
  // Загрузка дорожной карты проекта
  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/roadmap`);

        if (response.status === 404) {
          // Дорожная карта для проекта еще не создана
          setHasRoadmap(false);
          setLoading(false);
          return;
        }

        // Проверяем дополнительно на пустой ответ по Content-Type
        const contentType = response.headers.get('content-type');
        if (response.status === 200 && (!contentType || !contentType.includes('application/json'))) {
          // Вернулся не JSON
          console.log('Получен не JSON ответ');
          setHasRoadmap(false);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          if (response.status === 400 || response.status === 500) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка при загрузке дорожной карты: ${response.status}`);
          } else {
            throw new Error(`Ошибка при загрузке дорожной карты: ${response.status}`);
          }
        }

        try {
          const data = await response.json();
          console.log('Получены данные дорожной карты:', data);

          // Проверяем, содержит ли ответ сообщение об ошибке
          if (data && typeof data === 'object' && 'message' in data) {
            if (data.message === "Roadmap not found" || data.message.includes("not found")) {
              setHasRoadmap(false);
              return;
            }
          }

          // Проверяем, содержит ли ответ признаки дорожной карты
          if (data && data.id && data.phases) {
            // Проверяем, есть ли задачи в фазах
            let hasTasks = false;
            if (data.phases && Array.isArray(data.phases)) {
              for (const phase of data.phases) {
                if (phase.tasks && Array.isArray(phase.tasks) && phase.tasks.length > 0) {
                  hasTasks = true;
                  break;
                }
              }
            }

            console.log("Дорожная карта содержит задачи:", hasTasks);

            // Устанавливаем дорожную карту
            setRoadmap(data);
            setHasRoadmap(true);
          } else {
            console.log("Ответ не соответствует структуре дорожной карты:", data);
            setHasRoadmap(false);
          }
        } catch (error) {
          console.error('Ошибка обработки данных дорожной карты:', error);
          setHasRoadmap(false);
        }
      } catch (err) {
        console.error('Ошибка загрузки дорожной карты:', err);
        // Проверяем, связана ли ошибка с отсутствием дорожной карты или с парсингом пустого JSON
        if (
          (err instanceof Error && err.message.includes("not found")) ||
          (err instanceof Error && err.message.includes("Unexpected end of JSON input")) ||
          (err instanceof Error && err.message.includes("JSON"))
        ) {
          // Это скорее всего просто отсутствие дорожной карты, а не реальная ошибка
          setHasRoadmap(false);
          setError(null); // Очищаем ошибку, если она была ранее
        } else {
          // Это реальная ошибка, которую нужно показать пользователю
          setError('Не удалось загрузить дорожную карту. Пожалуйста, попробуйте позже.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [projectId]);
  
  // Обработчик клика по задаче
  const handleTaskClick = (taskId: string, phaseId: string) => {
    if (!roadmap) return;
    
    const phase = roadmap.phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };
  
  // Закрытие модального окна задачи
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };
  
  // Преобразование данных для компонента PhaseList
  const preparePhaseData = (): ProjectPhaseProps[] => {
    if (!roadmap) return [];

    // Логируем содержимое дорожной карты
    console.log('Обработка roadmap в preparePhaseData:', JSON.stringify(roadmap));

    // Проверяем наличие фаз
    const phases = roadmap.phases || [];
    console.log('Фазы из roadmap:', phases);

    if (phases.length === 0) {
      console.warn('Дорожная карта без фаз:', roadmap);
      return [];
    }

    // Безопасное преобразование дат
    const safeDate = (dateString) => {
      if (!dateString) return undefined;
      try {
        return new Date(dateString);
      } catch (e) {
        console.error('Ошибка преобразования даты:', e);
        return undefined;
      }
    };

    return phases.map(phase => ({
      id: phase.id,
      name: phase.name || 'Без названия',
      ruName: phase.ruName || phase.name || 'Без названия',
      order: phase.order || 0, // Default to 0 if no order is specified
      startDate: safeDate(phase.startDate),
      endDate: safeDate(phase.endDate),
      status: phase.status || 'NOT_STARTED', // Default status
      progress: phase.progress || 0, // Default progress
      tasks: (phase.tasks || []).map(task => {
        console.log(`Обработка задачи ${task.id}:`, task);
        return {
          id: task.id,
          name: task.name || 'Задача без названия',
          ruName: task.ruName || task.name || 'Задача без названия',
          description: task.description || '',
          ruDescription: task.ruDescription || task.description || '',
          status: task.status || 'TODO', // Default task status
          priority: task.priority || 2, // Default medium priority
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          dueDate: safeDate(task.dueDate),
          assignedToUserId: task.assignedToUserId,
          artifactLinks: task.artifactLinks || [],
          projectId,
          phaseId: phase.id
        };
      }),
      projectRoadmapId: roadmap.id || '',
      projectId
    }));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Загрузка дорожной карты...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 bg-red-600 text-white px-3 py-1 rounded-md"
        >
          Повторить
        </button>
      </div>
    );
  }
  
  if (!hasRoadmap) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12 bg-gray-50 rounded-lg border mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Дорожная карта не создана</h2>
          <p className="text-gray-600 mb-6">Для этого проекта еще не создана дорожная карта</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Использовать рекомендуемый фреймворк
            </h3>
            <p className="text-gray-600 mb-4">
              Система автоматически проанализирует ваш проект и предложит наиболее подходящий фреймворк с готовыми этапами и задачами.
            </p>
            <ul className="text-gray-700 mb-6 space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>ИИ выберет оптимальный фреймворк</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Готовые этапы и структурированные задачи</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Быстрый старт проекта</span>
              </li>
            </ul>
            <Link
              href={`/dashboard/projects/${projectId}/frameworks`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Выбрать рекомендуемый фреймворк
            </Link>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold mb-3 text-indigo-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Создать свою дорожную карту
            </h3>
            <p className="text-gray-600 mb-4">
              Создайте собственную дорожную карту проекта с нуля или выберите готовый фреймворк из каталога и настройте его под свои задачи.
            </p>
            <ul className="text-gray-700 mb-6 space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Широкий выбор готовых фреймворков</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Возможность создания своих этапов и задач</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Полная кастомизация под ваши процессы</span>
              </li>
            </ul>
            <Link
              href={`/dashboard/projects/${projectId}/frameworks`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
              Создать свою дорожную карту
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Проверка наличия фаз в roadmap напрямую
  const hasPhases = roadmap && roadmap.phases && roadmap.phases.length > 0;
  console.log('Есть ли фазы в roadmap напрямую:', hasPhases);

  const frameworkName = roadmap?.framework?.ruName || roadmap?.framework?.name || 'Неизвестный фреймворк';
  const phasesData = preparePhaseData();
  console.log('Подготовленные данные фаз:', phasesData);

  // Проверка наличия фаз в подготовленных данных
  const hasProcessedPhases = phasesData.length > 0;
  console.log('Есть ли фазы после обработки:', hasProcessedPhases);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Дорожная карта проекта</h2>
          <div className="flex items-center text-gray-600 mb-4">
            <span>На основе фреймворка: </span>
            <span className="font-medium ml-1">{frameworkName}</span>
            {roadmap?.name && (
              <span className="ml-2">| {roadmap.name}</span>
            )}
          </div>
          {roadmap?.description && (
            <p className="text-gray-600 mb-4">{roadmap.description}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
          >
            Обновить
          </button>
        </div>
      </div>

      {hasProcessedPhases ? (
        <PhaseList
          phases={phasesData}
          projectId={projectId}
          onTaskClick={handleTaskClick}
        />
      ) : hasPhases ? (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
          <div className="text-blue-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold">Дорожная карта создана</h3>
          </div>
          <p className="text-gray-700 mb-4">
            Дорожная карта успешно создана и содержит {roadmap?.phases?.length || 0} фаз.
            Однако задачи еще не были добавлены к этим фазам.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/dashboard/projects/${projectId}/tasks`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Перейти к задачам
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Обновить
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
          <div className="text-yellow-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold">Данные дорожной карты некорректны</h3>
          </div>
          <p className="text-gray-700 mb-4">
            Дорожная карта была создана, но не содержит корректных данных о фазах и задачах.
            Попробуйте создать новую дорожную карту или обратитесь к администратору.
          </p>
          <Link
            href={`/dashboard/projects/${projectId}/frameworks`}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Создать новую дорожную карту
          </Link>
        </div>
      )}
      
      {/* Модальное окно для просмотра/редактирования задачи */}
      {isTaskModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{selectedTask.ruName || selectedTask.name}</h3>
                <button onClick={closeTaskModal} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  {selectedTask.status === 'TODO' && (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      К выполнению
                    </span>
                  )}
                  {selectedTask.status === 'IN_PROGRESS' && (
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      В работе
                    </span>
                  )}
                  {selectedTask.status === 'DONE' && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Выполнено
                    </span>
                  )}
                  
                  {selectedTask.priority === 1 && (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      Высокий приоритет
                    </span>
                  )}
                  {selectedTask.priority === 2 && (
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      Средний приоритет
                    </span>
                  )}
                  {selectedTask.priority === 3 && (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      Низкий приоритет
                    </span>
                  )}
                </div>
                
                {(selectedTask.ruDescription || selectedTask.description) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Описание:</h4>
                    <p className="text-gray-600">{selectedTask.ruDescription || selectedTask.description}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedTask.estimatedHours && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Оценка времени:</h4>
                    <p className="text-gray-600">{selectedTask.estimatedHours} часов</p>
                  </div>
                )}
                
                {selectedTask.actualHours && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Фактическое время:</h4>
                    <p className="text-gray-600">{selectedTask.actualHours} часов</p>
                  </div>
                )}
                
                {selectedTask.dueDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Срок выполнения:</h4>
                    <p className="text-gray-600">{selectedTask.dueDate.toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
              </div>
              
              {selectedTask.artifactLinks && selectedTask.artifactLinks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Связанные артефакты:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.artifactLinks.map(link => (
                      <Link 
                        key={link.id} 
                        href={`/dashboard/projects/${projectId}/artifacts#${link.artifact.id}`}
                        className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100"
                      >
                        {link.artifact.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-3"
                >
                  Закрыть
                </button>
                {/* Здесь можно добавить кнопки для редактирования задачи */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}