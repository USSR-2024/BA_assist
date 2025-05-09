'use client';

import React, { useState } from 'react';
import TaskCard, { TaskCardProps } from './TaskCard';

// Интерфейс для фазы проекта
export interface ProjectPhaseProps {
  id: string;
  name: string;
  ruName?: string;
  order: number;
  startDate?: Date;
  endDate?: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress: number;
  tasks: TaskCardProps[];
  projectRoadmapId: string;
  projectId: number;
}

// Интерфейс для передачи данных в компонент
interface PhaseListProps {
  phases: ProjectPhaseProps[];
  projectId: number;
  onTaskClick?: (taskId: string, phaseId: string) => void;
}

// Компонент списка фаз проекта
export const PhaseList: React.FC<PhaseListProps> = ({
  phases,
  projectId,
  onTaskClick
}) => {
  // Состояние для отслеживания открытых/закрытых фаз
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(phases.map(phase => phase.id)));
  
  // Функция для переключения состояния фазы (свернута/развернута)
  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };
  
  // Цвета для разных статусов фаз
  const statusColors = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800'
  };
  
  // Текстовые метки для статусов
  const statusLabels = {
    NOT_STARTED: 'Не начата',
    IN_PROGRESS: 'В работе',
    COMPLETED: 'Завершена',
    ON_HOLD: 'Приостановлена'
  };
  
  // Сортировка фаз по порядку
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedPhases.map(phase => (
        <div key={phase.id} className="bg-white border rounded-lg shadow">
          <div 
            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => togglePhase(phase.id)}
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">
                {expandedPhases.has(phase.id) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
              <h3 className="font-semibold text-lg">{phase.ruName || phase.name}</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[phase.status]}`}>
                {statusLabels[phase.status]}
              </span>
              
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-gray-700">{phase.progress}%</span>
                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${phase.progress}%` }}
                  ></div>
                </div>
              </div>
              
              {phase.startDate && phase.endDate && (
                <div className="text-sm text-gray-600">
                  {phase.startDate.toLocaleDateString('ru-RU')} - {phase.endDate.toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>
          </div>
          
          {/* Задачи фазы (видимые только при развернутой фазе) */}
          {expandedPhases.has(phase.id) && (
            <div className="border-t p-4">
              {phase.tasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Задачи для этой фазы отсутствуют
                </div>
              ) : (
                <div className="space-y-3">
                  {phase.tasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      {...task} 
                      projectId={projectId}
                      phaseId={phase.id}
                      onClick={() => onTaskClick && onTaskClick(task.id, phase.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {phases.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-gray-400 mb-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600">Дорожная карта проекта не была создана</p>
          <p className="text-sm text-gray-500 mt-1">Выберите фреймворк для создания дорожной карты</p>
        </div>
      )}
    </div>
  );
};

export default PhaseList;