'use client';

import React from 'react';
import Link from 'next/link';

// Определение интерфейсов для типизации
export interface TaskCardProps {
  id: string;
  name: string;
  ruName?: string;
  description?: string;
  ruDescription?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: number;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  assignedToUserId?: string;
  artifactLinks?: Array<{
    id: string;
    artifact: {
      id: string;
      name: string;
    };
  }>;
  projectId: number;
  phaseId: string;
  onClick?: () => void;
}

// Компонент карточки задачи
export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  name,
  ruName,
  description,
  ruDescription,
  status,
  priority,
  estimatedHours,
  actualHours,
  dueDate,
  assignedToUserId,
  artifactLinks = [],
  projectId,
  phaseId,
  onClick
}) => {
  // Преобразуем приоритет в текстовую метку
  const priorityLabel = {
    1: 'Высокий',
    2: 'Средний',
    3: 'Низкий'
  }[priority] || 'Средний';
  
  // Цвета для разных статусов задач
  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800'
  };
  
  // Цвета для разных приоритетов
  const priorityColors = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-gray-100 text-gray-800'
  };
  
  // Текстовые метки для статусов
  const statusLabels = {
    TODO: 'К выполнению',
    IN_PROGRESS: 'В работе',
    DONE: 'Выполнено'
  };

  return (
    <div 
      className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 mb-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{ruName || name}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[priority]}`}>
            {priorityLabel}
          </span>
        </div>
      </div>
      
      {(ruDescription || description) && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {ruDescription || description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-2">
        {estimatedHours && (
          <div className="text-xs text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {actualHours ? `${actualHours}/${estimatedHours}ч` : `${estimatedHours}ч`}
          </div>
        )}
        
        {dueDate && (
          <div className="text-xs text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dueDate.toLocaleDateString('ru-RU')}
          </div>
        )}
      </div>
      
      {artifactLinks && artifactLinks.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Связанные артефакты:</div>
          <div className="flex flex-wrap gap-1">
            {artifactLinks.map(link => (
              <Link 
                key={link.id} 
                href={`/dashboard/projects/${projectId}/artifacts#${link.artifact.id}`}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100"
                onClick={(e) => e.stopPropagation()}
              >
                {link.artifact.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;