'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Framework {
  id: string;
  name: string;
  ruName: string;
  description: string;
  ruDescription: string;
  methodologyTag: string[];
  isDefault: boolean;
  isSystem: boolean;
}

interface RecommendationResponse {
  frameworks: Framework[];
  aiRecommendation?: {
    frameworkId: string;
    reasoning: string;
  };
}

export default function FrameworksPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<{ frameworkId: string; reasoning: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  
  const router = useRouter();
  const projectId = parseInt(params.id, 10);
  
  // Функция для загрузки рекомендуемых фреймворков
  useEffect(() => {
    const fetchRecommendedFrameworks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/frameworks/recommend?projectId=${projectId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Ошибка при загрузке рекомендуемых фреймворков: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data.frameworks)) {
          setFrameworks(data.frameworks);

          // Пока без ИИ-рекомендаций в GET-запросе, поэтому выбираем первый фреймворк
          if (data.frameworks.length > 0) {
            // Сначала ищем фреймворк по умолчанию
            const defaultFramework = data.frameworks.find(f => f.isDefault);
            if (defaultFramework) {
              setSelectedFrameworkId(defaultFramework.id);
            } else {
              // Иначе выбираем первый в списке
              setSelectedFrameworkId(data.frameworks[0].id);
            }
          }
        } else {
          throw new Error('Получены некорректные данные фреймворков');
        }
      } catch (err) {
        console.error('Ошибка загрузки фреймворков:', err);
        setError('Не удалось загрузить рекомендуемые фреймворки. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedFrameworks();
  }, [projectId]);
  
  // Функция для создания дорожной карты на основе выбранного фреймворка
  const createRoadmap = async () => {
    if (!selectedFrameworkId) {
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frameworkId: selectedFrameworkId }),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при создании дорожной карты: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Перенаправляем на страницу дорожной карты
      router.push(`/dashboard/projects/${projectId}/roadmap`);
      
    } catch (err) {
      console.error('Ошибка создания дорожной карты:', err);
      setError('Не удалось создать дорожную карту. Пожалуйста, попробуйте позже.');
    } finally {
      setCreating(false);
    }
  };
  
  // Функция для переключения отображения деталей фреймворка
  const toggleDetails = (frameworkId: string) => {
    setShowDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(frameworkId)) {
        newSet.delete(frameworkId);
      } else {
        newSet.add(frameworkId);
      }
      return newSet;
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Загрузка рекомендуемых фреймворков...</p>
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Выбор фреймворка для проекта</h2>
        <p className="text-gray-600">
          Выберите фреймворк для создания дорожной карты вашего проекта. На основе фреймворка будут созданы этапы и задачи.
        </p>
        
        {aiRecommendation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Рекомендация ИИ</h3>
            <p className="text-blue-700 mb-2">
              Рекомендуемый фреймворк: <strong>{frameworks.find(f => f.id === aiRecommendation.frameworkId)?.ruName}</strong>
            </p>
            <div className="text-sm text-blue-600">
              <h4 className="font-medium mb-1">Обоснование:</h4>
              <p>{aiRecommendation.reasoning}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid gap-4 mb-6">
        {frameworks.map(framework => (
          <div key={framework.id} className="border rounded-lg overflow-hidden bg-white">
            <div className={`border-l-4 ${selectedFrameworkId === framework.id ? 'border-l-blue-500' : 'border-l-transparent'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id={`framework-${framework.id}`}
                      name="framework"
                      value={framework.id}
                      checked={selectedFrameworkId === framework.id}
                      onChange={() => setSelectedFrameworkId(framework.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <label htmlFor={`framework-${framework.id}`} className="block text-lg font-medium text-gray-900">
                        {framework.ruName}
                      </label>
                      <div className="flex flex-wrap mt-2 gap-2">
                        {framework.methodologyTag && framework.methodologyTag.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {framework.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            По умолчанию
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => toggleDetails(framework.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showDetails.has(framework.id) ? (
                      <span className="text-sm">Скрыть детали</span>
                    ) : (
                      <span className="text-sm">Показать детали</span>
                    )}
                  </button>
                </div>
                
                {showDetails.has(framework.id) && (
                  <div className="mt-4 pl-7">
                    <p className="text-gray-700">{framework.ruDescription}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={createRoadmap}
          disabled={!selectedFrameworkId || creating}
          className={`px-4 py-2 rounded-md ${
            !selectedFrameworkId || creating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {creating ? 'Создание дорожной карты...' : 'Создать дорожную карту'}
        </button>
      </div>
    </div>
  );
}