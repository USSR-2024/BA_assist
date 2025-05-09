import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number;
    title: string;
    status: string;
  };
}

const ProjectManageModal: React.FC<ProjectManageModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleAction = async (action: string) => {
    setConfirmAction(action);
  };

  const confirmActionHandler = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${project.id}/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: confirmAction }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Произошла ошибка при выполнении действия');
      }

      const result = await response.json();
      
      if (confirmAction === 'delete') {
        // Перенаправляем на страницу проектов после удаления
        router.push('/dashboard');
      } else {
        // Обновляем страницу для отображения изменений
        window.location.reload();
      }
      
      onClose();
    } catch (err) {
      console.error('Ошибка при управлении проектом:', err);
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionTitle = () => {
    switch (confirmAction) {
      case 'close':
        return 'Закрыть проект';
      case 'delete':
        return 'Удалить проект';
      case 'reopen':
        return 'Вернуть в активное состояние';
      default:
        return 'Управление проектом';
    }
  };

  const getActionDescription = () => {
    switch (confirmAction) {
      case 'close':
        return 'Проект будет помечен как завершенный. Это действие можно отменить, вернув проект в активное состояние.';
      case 'delete':
        return 'Проект будет помечен как удаленный и исчезнет из списка проектов. Это действие нельзя отменить.';
      case 'reopen':
        return 'Проект будет помечен как активный и вернется в основной список проектов.';
      default:
        return '';
    }
  };

  const renderActionButtons = () => {
    const isActive = project.status === 'ACTIVE';
    // Temporary solution - treat ARCHIVED with close UI as if it was CLOSED
    const isClosed = project.status === 'CLOSED' || project.status === 'ARCHIVED';

    return (
      <div className="space-y-4">
        {isActive && (
          <button
            onClick={() => handleAction('close')}
            className="w-full py-2 px-4 border border-yellow-500 text-yellow-700 rounded hover:bg-yellow-50 transition-colors"
          >
            Закрыть проект
          </button>
        )}

        {isClosed && (
          <button
            onClick={() => handleAction('reopen')}
            className="w-full py-2 px-4 border border-green-500 text-green-700 rounded hover:bg-green-50 transition-colors"
          >
            Переоткрыть проект
          </button>
        )}

        <button
          onClick={() => handleAction('delete')}
          className="w-full py-2 px-4 border border-red-500 text-red-700 rounded hover:bg-red-50 transition-colors"
        >
          Удалить проект
        </button>
      </div>
    );
  };

  const renderConfirmation = () => {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">{getActionDescription()}</p>
        
        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={() => setConfirmAction(null)}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Отмена
          </button>
          
          <button
            onClick={confirmActionHandler}
            className={`
              flex-1 py-2 px-4 rounded text-white
              ${confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 
                confirmAction === 'close' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                'bg-green-600 hover:bg-green-700'}
              transition-colors
            `}
            disabled={isLoading}
          >
            {isLoading ? 'Обработка...' : 'Подтвердить'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {confirmAction ? getActionTitle() : 'Управление проектом'}
          </h3>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {confirmAction ? renderConfirmation() : renderActionButtons()}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          {!confirmAction && (
            <button
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Закрыть
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManageModal;