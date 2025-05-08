'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface Task {
  id: number
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: number
  dueDate: string | null
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

  const updateTaskStatus = async (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      // Оптимистично обновляем UI сразу
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
      
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })
      
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
    const taskId = parseInt(draggableId.split('-')[1])
    
    // Make API call to update the task status
    updateTaskStatus(taskId, newStatus)
  }

  const getTasksByStatus = (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    return tasks.filter(task => task.status === status)
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
        <button
          onClick={() => setIsAddingTask(!isAddingTask)}
          className="btn"
        >
          {isAddingTask ? 'Отменить' : '+ Новая задача'}
        </button>
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
                            className="bg-white p-3 rounded-md shadow mb-3"
                          >
                            <div className="font-medium">{task.title}</div>
                            <div className="mt-2 flex justify-between items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-gray-500">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
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
                            className="bg-white p-3 rounded-md shadow mb-3"
                          >
                            <div className="font-medium">{task.title}</div>
                            <div className="mt-2 flex justify-between items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-gray-500">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
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
                            className="bg-white p-3 rounded-md shadow mb-3"
                          >
                            <div className="font-medium">{task.title}</div>
                            <div className="mt-2 flex justify-between items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-gray-500">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
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
    </div>
  )
}