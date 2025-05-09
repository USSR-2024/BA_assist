'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import Link from 'next/link'

interface Task {
  id: string | number
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: number
  dueDate: string | null
  description?: string
  estimatedHours?: number
  actualHours?: number
  assignedToUserId?: string
  // Поля для задач дорожной карты
  isRoadmapTask?: boolean
  phaseId?: string
  phaseName?: string
  roadmapId?: string
  frameworkTaskId?: string
  artifactLinks?: Array<{
    id: string
    artifact: {
      id: string
      name: string
    }
  }>
}

export default function TasksPage() {
  // Используем useParams для получения параметров в клиентском компоненте
  const params = useParams()
  const projectId = params.id
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState(2) // Default medium priority
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showRoadmapTasks, setShowRoadmapTasks] = useState(true)
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchTasks()
    }
  }, [projectId, retryCount])

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      
      if (!res.ok) {
        throw new Error(res.status === 404 
          ? 'Задачи для этого проекта не найдены' 
          : 'Не удалось загрузить задачи')
      }
      
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Ошибка получения задач:', error)
      setError('Не удалось загрузить задачи. Возможно, задачи для этого проекта еще не созданы.')
      // Если ошибка - не показываем полностью пустой экран, а предлагаем создать первую задачу
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTaskTitle.trim()) {
      return
    }
    
    setSubmitting(true)
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
        }),
      })
      
      if (!res.ok) {
        throw new Error('Ошибка создания задачи')
      }
      
      // Получим данные созданной задачи
      const newTask = await res.json()
      
      // Добавим новую задачу локально без перезагрузки всего списка
      setTasks(prev => [...prev, newTask.task])
      
      // Если у нас была ошибка загрузки, но создание задачи прошло успешно, очистим ошибку
      if (error) {
        setError('')
      }
      
      // Reset form
      setNewTaskTitle('')
      setNewTaskPriority(2)
      setNewTaskDueDate('')
      setIsAddingTask(false)
    } catch (error) {
      console.error('Ошибка создания задачи:', error)
      alert('Не удалось создать задачу. Пожалуйста, попробуйте еще раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateTaskStatus = async (taskId: string | number, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      // Определяем, является ли это задачей дорожной карты или обычной задачей
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Задача не найдена');
      }
      
      // Оптимистично обновляем UI сразу
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
      
      let res;
      
      if (task.isRoadmapTask) {
        // Если это задача дорожной карты, используем новый API-эндпоинт
        res = await fetch(`/api/roadmap-tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });
      } else {
        // Если это обычная задача, используем старый API-эндпоинт
        res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });
      }
      
      if (!res.ok) {
        throw new Error('Ошибка обновления задачи')
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error)
      // Rollback the local state change
      alert('Не удалось обновить статус задачи. Обновляем список...')
      fetchTasks()
    }
  }

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    
    // Dropped outside the list
    if (!destination) {
      return
    }
    
    // No change
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }
    
    // Convert the new column to a task status
    const newStatus = destination.droppableId as 'TODO' | 'IN_PROGRESS' | 'DONE'
    
    // Get the task id from the draggableId
    const taskIdStr = draggableId.split('-')[1]
    
    // Определяем тип задачи по формату ID
    // Если ID содержит только цифры, то это обычная задача (id: number)
    // В противном случае это задача дорожной карты (id: string в формате UUID)
    const taskId = /^\d+$/.test(taskIdStr) ? parseInt(taskIdStr) : taskIdStr
    
    // Make API call to update the task status
    updateTaskStatus(taskId, newStatus)
  }

  // Обработчик нажатия на задачу
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditedTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours
    });
    setIsEditMode(false);
    setIsTaskModalOpen(true);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setEditedTask({});
    setIsEditMode(false);
  };

  // Обработчик переключения в режим редактирования
  const handleEditMode = () => {
    setIsEditMode(true);
  };

  // Обработчик изменения полей задачи
  const handleTaskFieldChange = (field: string, value: any) => {
    setEditedTask({
      ...editedTask,
      [field]: value
    });
  };

  // Обработчик сохранения изменений задачи
  const handleSaveTask = async () => {
    if (!selectedTask) return;

    setIsSaving(true);

    try {
      // Определяем, является ли это задачей дорожной карты или обычной задачей
      const isRoadmapTask = selectedTask.isRoadmapTask;

      // Формируем данные для обновления
      const updateData = {
        title: editedTask.title,
        description: editedTask.description,
        status: editedTask.status,
        priority: editedTask.priority,
        dueDate: editedTask.dueDate,
        estimatedHours: editedTask.estimatedHours,
        actualHours: editedTask.actualHours
      };

      // Выполняем запрос к соответствующему API
      let res;
      if (isRoadmapTask) {
        res = await fetch(`/api/roadmap-tasks/${selectedTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
      } else {
        res = await fetch(`/api/tasks/${selectedTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
      }

      if (!res.ok) {
        throw new Error('Ошибка обновления задачи');
      }

      // Обновляем состояние задачи в интерфейсе
      setTasks(tasks.map(task =>
        task.id === selectedTask.id ? { ...task, ...updateData } : task
      ));

      // Выходим из режима редактирования
      setIsEditMode(false);

      // Обновляем выбранную задачу
      setSelectedTask({ ...selectedTask, ...updateData });

    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
      alert('Не удалось обновить задачу. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  // Получить уникальные фазы из задач дорожной карты
  const getUniquePhases = () => {
    const phases = tasks
      .filter(task => task.isRoadmapTask && task.phaseName)
      .map(task => ({
        id: task.phaseId || '',
        name: task.phaseName || 'Без названия'
      }));

    // Удаляем дубликаты по id
    const uniquePhases = Array.from(
      new Map(phases.map(phase => [phase.id, phase])).values()
    );

    return uniquePhases;
  }

  const getTasksByStatus = (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    // Сначала применяем фильтрацию по типу задач (обычные/дорожная карта)
    let filteredTasks = showRoadmapTasks ?
      tasks :
      tasks.filter(task => !task.isRoadmapTask);

    // Затем применяем фильтр по фазе, если выбрана конкретная фаза
    if (selectedPhase !== 'all') {
      filteredTasks = filteredTasks.filter(task =>
        task.isRoadmapTask && task.phaseId === selectedPhase
      );
    }

    // И наконец фильтруем по статусу
    return filteredTasks.filter(task => task.status === status);
  }

  const getPriorityClass = (priority: number) => {
    switch(priority) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch(priority) {
      case 1: return 'Низкий'
      case 2: return 'Средний'
      case 3: return 'Высокий'
      default: return 'Неизвестно'
    }
  }

  // Функция для безопасного отображения артефактов с проверкой на undefined
  const renderArtifactLinks = (artifactLinks) => {
    if (!artifactLinks || artifactLinks.length === 0) return null;

    return (
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1">Артефакты:</div>
        <div className="flex flex-wrap gap-1">
          {artifactLinks.map(link => {
            // Проверяем, существует ли артефакт
            if (!link || !link.artifact) return null;

            return (
              <Link
                key={link.id}
                href={`/dashboard/projects/${projectId}/artifacts#${link.artifact.id}`}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100"
                onClick={(e) => e.stopPropagation()}
              >
                {link.artifact.name || 'Артефакт'}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading && retryCount === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Задачи проекта</h3>
        <div className="flex gap-3 items-center">
          <div className="flex items-center mr-4">
            <input
              id="showRoadmapTasks"
              type="checkbox"
              checked={showRoadmapTasks}
              onChange={() => {
                setShowRoadmapTasks(!showRoadmapTasks);
                // Сбросить фильтр по фазе, если скрываем задачи дорожной карты
                if (showRoadmapTasks) {
                  setSelectedPhase('all');
                }
              }}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="showRoadmapTasks" className="ml-2 text-sm text-gray-700">
              Задачи дорожной карты
            </label>
          </div>

          {showRoadmapTasks && (
            <div className="flex items-center mr-4">
              <label htmlFor="phaseFilter" className="mr-2 text-sm text-gray-700">
                Фаза:
              </label>
              <select
                id="phaseFilter"
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="all">Все фазы</option>
                {getUniquePhases().map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="btn"
          >
            {isAddingTask ? 'Отменить' : '+ Новая задача'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
              {!loading && (
                <div className="mt-2">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Попробовать еще раз
                  </button>
                  <span className="ml-2 text-xs text-gray-500">или создайте первую задачу прямо сейчас</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddingTask && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md shadow">
          <h4 className="text-md font-medium text-gray-700 mb-3">Добавить задачу</h4>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">
                Название*
              </label>
              <input
                type="text"
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Введите название задачи"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700">
                  Приоритет
                </label>
                <select
                  id="task-priority"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(parseInt(e.target.value))}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value={1}>Низкий</option>
                  <option value={2}>Средний</option>
                  <option value={3}>Высокий</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700">
                  Срок (опционально)
                </label>
                <input
                  type="date"
                  id="task-due-date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting || !newTaskTitle.trim()}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {submitting ? 'Создание...' : 'Создать задачу'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && retryCount > 0 && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mr-3"></div>
          <span className="text-gray-600">Обновление списка задач...</span>
        </div>
      )}

      {!loading && tasks.length === 0 && !error && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Задач пока нет</h3>
          <p className="mt-1 text-sm text-gray-500">
            Чтобы начать работу с задачами, создайте первую задачу.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Создать задачу
            </button>
          </div>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TODO Column */}
            <div className="bg-gray-50 rounded-md shadow p-4">
              <h4 className="font-medium text-gray-700 mb-4">К выполнению</h4>
              <Droppable droppableId="TODO">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px]"
                  >
                    {getTasksByStatus('TODO').map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={`task-${task.id}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 rounded-md shadow mb-3 ${task.isRoadmapTask ? 'border-l-4 border-indigo-500' : ''} hover:shadow-md cursor-pointer`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="font-medium">{task.title}</div>
                            
                            {task.isRoadmapTask && task.phaseName && (
                              <div className="mt-1 text-xs text-gray-500">
                                Фаза: {task.phaseName}
                              </div>
                            )}
                            
                            {task.description && (
                              <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {task.description}
                              </div>
                            )}
                            
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              
                              {task.dueDate && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              
                              {task.estimatedHours && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {task.actualHours ? `${task.actualHours}/${task.estimatedHours}ч` : `${task.estimatedHours}ч`}
                                </span>
                              )}
                              
                              {task.isRoadmapTask && (
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                                  Дорожная карта
                                </span>
                              )}
                            </div>
                            
                            {task.isRoadmapTask && renderArtifactLinks(task.artifactLinks)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {getTasksByStatus('TODO').length === 0 && (
                      <div className="text-sm text-gray-500 italic text-center mt-4">
                        Нет задач к выполнению
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* IN_PROGRESS Column */}
            <div className="bg-gray-50 rounded-md shadow p-4">
              <h4 className="font-medium text-gray-700 mb-4">В работе</h4>
              <Droppable droppableId="IN_PROGRESS">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px]"
                  >
                    {getTasksByStatus('IN_PROGRESS').map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={`task-${task.id}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 rounded-md shadow mb-3 ${task.isRoadmapTask ? 'border-l-4 border-indigo-500' : ''} hover:shadow-md cursor-pointer`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="font-medium">{task.title}</div>
                            
                            {task.isRoadmapTask && task.phaseName && (
                              <div className="mt-1 text-xs text-gray-500">
                                Фаза: {task.phaseName}
                              </div>
                            )}
                            
                            {task.description && (
                              <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {task.description}
                              </div>
                            )}
                            
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              
                              {task.dueDate && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              
                              {task.estimatedHours && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {task.actualHours ? `${task.actualHours}/${task.estimatedHours}ч` : `${task.estimatedHours}ч`}
                                </span>
                              )}
                              
                              {task.isRoadmapTask && (
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                                  Дорожная карта
                                </span>
                              )}
                            </div>
                            
                            {task.isRoadmapTask && renderArtifactLinks(task.artifactLinks)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {getTasksByStatus('IN_PROGRESS').length === 0 && (
                      <div className="text-sm text-gray-500 italic text-center mt-4">
                        Нет задач в работе
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* DONE Column */}
            <div className="bg-gray-50 rounded-md shadow p-4">
              <h4 className="font-medium text-gray-700 mb-4">Выполнено</h4>
              <Droppable droppableId="DONE">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px]"
                  >
                    {getTasksByStatus('DONE').map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={`task-${task.id}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 rounded-md shadow mb-3 ${task.isRoadmapTask ? 'border-l-4 border-indigo-500' : ''} hover:shadow-md cursor-pointer`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="font-medium">{task.title}</div>
                            
                            {task.isRoadmapTask && task.phaseName && (
                              <div className="mt-1 text-xs text-gray-500">
                                Фаза: {task.phaseName}
                              </div>
                            )}
                            
                            {task.description && (
                              <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {task.description}
                              </div>
                            )}
                            
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              
                              {task.dueDate && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              
                              {task.estimatedHours && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {task.actualHours ? `${task.actualHours}/${task.estimatedHours}ч` : `${task.estimatedHours}ч`}
                                </span>
                              )}
                              
                              {task.isRoadmapTask && (
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                                  Дорожная карта
                                </span>
                              )}
                            </div>
                            
                            {task.isRoadmapTask && renderArtifactLinks(task.artifactLinks)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {getTasksByStatus('DONE').length === 0 && (
                      <div className="text-sm text-gray-500 italic text-center mt-4">
                        Нет выполненных задач
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Модальное окно задачи */}
      {isTaskModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedTask.title || ''}
                    onChange={(e) => handleTaskFieldChange('title', e.target.value)}
                    className="text-xl font-bold w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <h3 className="text-xl font-bold">{selectedTask.title}</h3>
                )}
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  {isEditMode ? (
                    <select
                      value={editedTask.status || 'TODO'}
                      onChange={(e) => handleTaskFieldChange('status', e.target.value)}
                      className="px-2 py-1 rounded-full text-xs border border-gray-300"
                    >
                      <option value="TODO">К выполнению</option>
                      <option value="IN_PROGRESS">В работе</option>
                      <option value="DONE">Выполнено</option>
                    </select>
                  ) : (
                    <>
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
                    </>
                  )}

                  {isEditMode ? (
                    <select
                      value={editedTask.priority || 2}
                      onChange={(e) => handleTaskFieldChange('priority', parseInt(e.target.value))}
                      className="px-2 py-1 rounded-full text-xs border border-gray-300"
                    >
                      <option value={1}>Низкий</option>
                      <option value={2}>Средний</option>
                      <option value={3}>Высокий</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(selectedTask.priority)}`}>
                      {getPriorityLabel(selectedTask.priority)}
                    </span>
                  )}

                  {selectedTask.isRoadmapTask && (
                    <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                      Дорожная карта
                    </span>
                  )}
                </div>

                {selectedTask.isRoadmapTask && selectedTask.phaseName && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Фаза: {selectedTask.phaseName}</span>
                  </div>
                )}

                {isEditMode ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание:</label>
                    <textarea
                      value={editedTask.description || ''}
                      onChange={(e) => handleTaskFieldChange('description', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 h-24"
                      placeholder="Описание задачи..."
                    />
                  </div>
                ) : (
                  selectedTask.description && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Описание:</h4>
                      <p className="text-gray-600">{selectedTask.description}</p>
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {isEditMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Оценка времени (часы):</label>
                      <input
                        type="number"
                        value={editedTask.estimatedHours || ''}
                        onChange={(e) => handleTaskFieldChange('estimatedHours', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-md p-2"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Фактическое время (часы):</label>
                      <input
                        type="number"
                        value={editedTask.actualHours || ''}
                        onChange={(e) => handleTaskFieldChange('actualHours', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-md p-2"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Срок выполнения:</label>
                      <input
                        type="date"
                        value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleTaskFieldChange('dueDate', e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                        <p className="text-gray-600">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedTask.isRoadmapTask && selectedTask.artifactLinks && selectedTask.artifactLinks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Связанные артефакты:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.artifactLinks.map(link => {
                      if (!link || !link.artifact) return null;
                      return (
                        <Link
                          key={link.id}
                          href={`/dashboard/projects/${projectId}/artifacts#${link.artifact.id}`}
                          className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100"
                        >
                          {link.artifact.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-8">
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-3"
                      disabled={isSaving}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTask}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-3"
                    >
                      Закрыть
                    </button>
                    <button
                      type="button"
                      onClick={handleEditMode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Редактировать
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}