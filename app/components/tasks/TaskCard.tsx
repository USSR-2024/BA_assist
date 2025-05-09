'use client';

import React from 'react';

interface Artifact {
  id: string;
  name: string;
}

interface ArtifactLink {
  id: string;
  artifact: Artifact;
}

interface TaskCardProps {
  id: string | number;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: number;
  dueDate?: string | null;
  description?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedToUserId?: string;
  isRoadmapTask?: boolean;
  phaseName?: string;
  artifactLinks?: ArtifactLink[];
  provided: any; // Props для react-beautiful-dnd
}

const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  status,
  priority,
  dueDate,
  description,
  estimatedHours,
  actualHours,
  isRoadmapTask,
  phaseName,
  artifactLinks,
  provided
}) => {
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

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white p-3 rounded-md shadow mb-3 ${isRoadmapTask ? 'border-l-4 border-indigo-500' : ''}`}
    >
      <div className="font-medium">{title}</div>
      
      {isRoadmapTask && phaseName && (
        <div className="mt-1 text-xs text-gray-500">
          Фаза: {phaseName}
        </div>
      )}
      
      {description && (
        <div className="mt-1 text-sm text-gray-600 line-clamp-2">
          {description}
        </div>
      )}
      
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(priority)}`}>
          {getPriorityLabel(priority)}
        </span>
        
        {dueDate && (
          <span className="text-xs text-gray-500 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(dueDate).toLocaleDateString()}
          </span>
        )}
        
        {estimatedHours && (
          <span className="text-xs text-gray-500 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {actualHours ? `${actualHours}/${estimatedHours}ч` : `${estimatedHours}ч`}
          </span>
        )}
        
        {isRoadmapTask && (
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
            Дорожная карта
          </span>
        )}
      </div>
      
      {isRoadmapTask && artifactLinks && artifactLinks.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Артефакты:</div>
          <div className="flex flex-wrap gap-1">
            {artifactLinks.map(link => (
              <span 
                key={link.id}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
              >
                {link.artifact.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;