'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InterviewProvider, useInterview } from '@/app/contexts/InterviewContext';
import { InterviewStep, FormGroup, StepNavigation, RadioOption, CheckboxOption } from '@/app/components/interview/InterviewStep';
import { InterviewAnalyzer } from '@/app/lib/interviewAnalyzer';

// Компонент для результатов анализа интервью
const AnalysisResults = () => {
  const { interviewData, analysisResults, setCurrentStep } = useInterview();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateTasks, setGenerateTasks] = useState(true);

  const handleCreateProject = async () => {
    if (!analysisResults) return;
    
    setCreating(true);
    setError(null);
    
    try {
      const projectData = {
        title: interviewData.title,
        description: interviewData.description,
        
        // Данные интервью
        sponsor: interviewData.sponsor,
        businessOwner: interviewData.businessOwner,
        businessNeed: interviewData.businessNeed,
        successMetrics: interviewData.successMetrics,
        scopeAreas: interviewData.scopeAreas,
        outOfScope: interviewData.outOfScope,
        deliverables: interviewData.deliverables,
        constraints: interviewData.constraints,
        targetDate: interviewData.targetDate,
        durationBucket: interviewData.durationBucket,
        coreTeamSize: interviewData.coreTeamSize,
        processMaturity: interviewData.processMaturity,
        preferredStyle: interviewData.preferredStyle,
        riskTolerance: interviewData.riskTolerance,
        initialArtifacts: interviewData.initialArtifacts,
        storageLinks: interviewData.storageLinks,
        notes: interviewData.notes,
        
        // Результаты анализа
        framework: analysisResults.framework,
        roadmap: analysisResults.roadmap,
        storageRules: analysisResults.storageRules
      };
      
      // 1. Создаем проект
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при создании проекта');
      }
      
      const data = await response.json();
      const projectId = data.id;
      
      // 2. Генерируем саммари проекта с помощью ИИ
      try {
        await fetch('/api/ai/summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId }),
        });
      } catch (summaryError) {
        console.error('Ошибка при генерации саммари:', summaryError);
        // Продолжаем, даже если не удалось сгенерировать саммари
      }
      
      // 3. Если пользователь выбрал создание задач, генерируем задачи на основе дорожной карты
      if (generateTasks && analysisResults.roadmap) {
        try {
          await fetch('/api/ai/roadmap/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              projectId,
              roadmap: analysisResults.roadmap
            }),
          });
        } catch (tasksError) {
          console.error('Ошибка при генерации задач:', tasksError);
          // Продолжаем, даже если не удалось сгенерировать задачи
        }
      }
      
      // 4. Перенаправляем на страницу проекта
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      console.error('Ошибка создания проекта:', err);
      setError('Не удалось создать проект. Пожалуйста, попробуйте еще раз.');
    } finally {
      setCreating(false);
    }
  };

  if (!analysisResults) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Анализ проекта</h2>
      <p className="text-gray-600 mb-6">
        На основе ваших ответов мы подготовили рекомендуемую структуру проекта.
      </p>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Проект: {interviewData.title}</h3>
        <p className="text-gray-700">{interviewData.description}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Рекомендуемый фреймворк</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">{analysisResults.framework}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Дорожная карта проекта</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Фаза
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Недели
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Артефакты
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analysisResults.roadmap.map((phase, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {phase.phase}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {phase.weeks}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      {phase.artifacts.map((artifact, i) => (
                        <li key={i}>{artifact}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Правила автоклассификации</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-700">{analysisResults.storageRules}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <input
            id="generate-tasks"
            type="checkbox"
            checked={generateTasks}
            onChange={(e) => setGenerateTasks(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="generate-tasks" className="ml-2 block text-sm text-gray-700">
            Автоматически создать задачи на основе дорожной карты
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-6">
          Для каждой фазы и артефакта из дорожной карты будут созданы соответствующие задачи в проекте.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Начать заново
        </button>
        <button
          type="button"
          onClick={handleCreateProject}
          disabled={creating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {creating ? 'Создание проекта...' : 'Создать проект'}
        </button>
      </div>
    </div>
  );
};

// Основной компонент интервью
const InterviewWizard = () => {
  const { interviewData, currentStep, setInterviewData, setCurrentStep, setAnalysisResults } = useInterview();
  const [deliverablesList, setDeliverablesList] = useState<string[]>([]);
  const totalSteps = 7;

  // Функция для перехода к следующему шагу
  const handleNext = async () => {
    if (currentStep === totalSteps - 1) {
      try {
        // Последний шаг - анализируем ответы через ИИ
        const response = await fetch('/api/ai/roadmap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(interviewData),
        });
        
        if (!response.ok) {
          throw new Error('Ошибка при анализе данных');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setAnalysisResults(data.data);
        } else {
          // Если возникла проблема с ИИ, используем локальный анализатор
          const results = InterviewAnalyzer.analyzeInterview(interviewData);
          setAnalysisResults(results);
        }
      } catch (error) {
        console.error('Ошибка при получении рекомендаций от ИИ:', error);
        // В случае ошибки используем локальный анализатор
        const results = InterviewAnalyzer.analyzeInterview(interviewData);
        setAnalysisResults(results);
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  // Функция для возврата к предыдущему шагу
  const handlePrevious = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  // Обработчик изменения списка deliverables
  const handleDeliverableChange = (value: string, checked: boolean) => {
    setDeliverablesList(prev => {
      const newList = checked
        ? [...prev, value]
        : prev.filter(item => item !== value);
        
      setInterviewData({ deliverables: newList.join(', ') });
      return newList;
    });
  };

  return (
    <div className="py-8">
      {/* Шаг 1: Основные сведения */}
      <InterviewStep
        title="Основные сведения о проекте"
        description="Базовая информация о проекте и ключевых контактных лицах."
        currentStep={currentStep}
        stepNumber={0}
      >
        <FormGroup label="Название проекта" htmlFor="title" required>
          <input
            id="title"
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.title}
            onChange={(e) => setInterviewData({ title: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup label="Описание проекта" htmlFor="description">
          <textarea
            id="description"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.description || ''}
            onChange={(e) => setInterviewData({ description: e.target.value })}
          />
        </FormGroup>

        <FormGroup 
          label="Заказчик / Спонсор" 
          htmlFor="sponsor"
          helper="Кто утверждает бюджет и владеет выгодой от проекта (ФИО + роль)"
        >
          <input
            id="sponsor"
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.sponsor || ''}
            onChange={(e) => setInterviewData({ sponsor: e.target.value })}
          />
        </FormGroup>

        <FormGroup 
          label="Владелец требований" 
          htmlFor="businessOwner"
          helper="Главное контактное лицо по содержанию проекта"
        >
          <input
            id="businessOwner"
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.businessOwner || ''}
            onChange={(e) => setInterviewData({ businessOwner: e.target.value })}
          />
        </FormGroup>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
          isNextDisabled={!interviewData.title}
        />
      </InterviewStep>

      {/* Шаг 2: Цель и ценность */}
      <InterviewStep
        title="Цель и ожидаемая ценность"
        description="Определите основную потребность бизнеса и критерии успеха."
        currentStep={currentStep}
        stepNumber={1}
      >
        <FormGroup 
          label="Бизнес-потребность" 
          htmlFor="businessNeed"
          helper="Какая одна главная бизнес-потребность решается? (1-2 предложения)"
          required
        >
          <textarea
            id="businessNeed"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.businessNeed || ''}
            onChange={(e) => setInterviewData({ businessNeed: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup 
          label="Метрики успеха" 
          htmlFor="successMetrics"
          helper="По каким метрикам поймём, что проект успешен? (≤ 3)"
        >
          <textarea
            id="successMetrics"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.successMetrics || ''}
            onChange={(e) => setInterviewData({ successMetrics: e.target.value })}
          />
        </FormGroup>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
          isNextDisabled={!interviewData.businessNeed}
        />
      </InterviewStep>

      {/* Шаг 3: Масштаб и ограничения */}
      <InterviewStep
        title="Масштаб и ограничения"
        description="Определите границы проекта и важные ограничения."
        currentStep={currentStep}
        stepNumber={2}
      >
        <FormGroup 
          label="Бизнес-области" 
          htmlFor="scopeAreas"
          helper="Какие бизнес-подразделения/процессы затронем?"
        >
          <textarea
            id="scopeAreas"
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.scopeAreas || ''}
            onChange={(e) => setInterviewData({ scopeAreas: e.target.value })}
          />
        </FormGroup>

        <FormGroup 
          label="За рамками проекта" 
          htmlFor="outOfScope"
          helper="Что точно не входит в рамки проекта? (важно для избегания недопонимания)"
        >
          <textarea
            id="outOfScope"
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.outOfScope || ''}
            onChange={(e) => setInterviewData({ outOfScope: e.target.value })}
          />
        </FormGroup>

        <FormGroup 
          label="Желаемый результат" 
          htmlFor="deliverables"
          helper="Какой тип результатов ожидается от проекта?"
        >
          <div className="mt-1 space-y-2">
            <CheckboxOption
              id="deliverable-doc"
              name="deliverables"
              value="Документ"
              label="Документация (спецификации, описания)"
              checked={deliverablesList.includes('Документ')}
              onChange={(e) => handleDeliverableChange('Документ', e.target.checked)}
            />
            <CheckboxOption
              id="deliverable-prototype"
              name="deliverables"
              value="Прототип"
              label="Прототип (интерактивный, демо-версия)"
              checked={deliverablesList.includes('Прототип')}
              onChange={(e) => handleDeliverableChange('Прототип', e.target.checked)}
            />
            <CheckboxOption
              id="deliverable-process"
              name="deliverables"
              value="Внедренный процесс"
              label="Внедренный процесс (рабочие процедуры)"
              checked={deliverablesList.includes('Внедренный процесс')}
              onChange={(e) => handleDeliverableChange('Внедренный процесс', e.target.checked)}
            />
            <CheckboxOption
              id="deliverable-software"
              name="deliverables"
              value="Программное решение"
              label="Программное решение (работающий код)"
              checked={deliverablesList.includes('Программное решение')}
              onChange={(e) => handleDeliverableChange('Программное решение', e.target.checked)}
            />
          </div>
        </FormGroup>

        <FormGroup 
          label="Ограничения" 
          htmlFor="constraints"
          helper="Есть 'неприкосновенные' сроки, бюджет, технологии, регуляторы?"
        >
          <textarea
            id="constraints"
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.constraints || ''}
            onChange={(e) => setInterviewData({ constraints: e.target.value })}
          />
        </FormGroup>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </InterviewStep>

      {/* Шаг 4: Временные параметры */}
      <InterviewStep
        title="Временные параметры"
        description="Оцените ожидаемую длительность и ключевые сроки проекта."
        currentStep={currentStep}
        stepNumber={3}
      >
        <FormGroup 
          label="Целевая дата" 
          htmlFor="targetDate"
          helper="К какой дате нужно получить результат?"
        >
          <input
            id="targetDate"
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.targetDate || ''}
            onChange={(e) => setInterviewData({ targetDate: e.target.value })}
          />
        </FormGroup>

        <FormGroup 
          label="Ожидаемая продолжительность" 
          htmlFor="durationBucket"
          helper="О каком горизонте работ идёт речь?"
        >
          <div className="mt-1 space-y-2">
            <RadioOption
              id="duration-1"
              name="durationBucket"
              value="≤ 1 мес (Spike/PoC)"
              label="≤ 1 мес (Spike/PoC) - Короткое исследование или проверка концепции"
              checked={interviewData.durationBucket === '≤ 1 мес (Spike/PoC)'}
              onChange={(e) => setInterviewData({ durationBucket: e.target.value })}
            />
            <RadioOption
              id="duration-2"
              name="durationBucket"
              value="1-3 мес (MVP)"
              label="1-3 мес (MVP) - Минимально жизнеспособный продукт"
              checked={interviewData.durationBucket === '1-3 мес (MVP)'}
              onChange={(e) => setInterviewData({ durationBucket: e.target.value })}
            />
            <RadioOption
              id="duration-3"
              name="durationBucket"
              value="3-6 мес (Release)"
              label="3-6 мес (Release) - Полный релиз продукта/решения"
              checked={interviewData.durationBucket === '3-6 мес (Release)'}
              onChange={(e) => setInterviewData({ durationBucket: e.target.value })}
            />
            <RadioOption
              id="duration-4"
              name="durationBucket"
              value="> 6 мес (Program)"
              label="> 6 мес (Program) - Программа/долгосрочная инициатива"
              checked={interviewData.durationBucket === '> 6 мес (Program)'}
              onChange={(e) => setInterviewData({ durationBucket: e.target.value })}
            />
          </div>
        </FormGroup>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </InterviewStep>

      {/* Шаг 5: Ресурсы и зрелость */}
      <InterviewStep
        title="Ресурсы и зрелость"
        description="Оцените доступные ресурсы и существующую зрелость процессов."
        currentStep={currentStep}
        stepNumber={4}
      >
        <FormGroup 
          label="Ядро команды" 
          htmlFor="coreTeamSize"
          helper="Сколько людей готовы выделить > 50% времени на проект?"
        >
          <div className="mt-1 space-y-2">
            <RadioOption
              id="team-1"
              name="coreTeamSize"
              value="0"
              label="0 (нет выделенных ресурсов)"
              checked={interviewData.coreTeamSize === '0'}
              onChange={(e) => setInterviewData({ coreTeamSize: e.target.value })}
            />
            <RadioOption
              id="team-2"
              name="coreTeamSize"
              value="1-3"
              label="1-3 человека"
              checked={interviewData.coreTeamSize === '1-3'}
              onChange={(e) => setInterviewData({ coreTeamSize: e.target.value })}
            />
            <RadioOption
              id="team-3"
              name="coreTeamSize"
              value="4-7"
              label="4-7 человек"
              checked={interviewData.coreTeamSize === '4-7'}
              onChange={(e) => setInterviewData({ coreTeamSize: e.target.value })}
            />
            <RadioOption
              id="team-4"
              name="coreTeamSize"
              value="> 7"
              label="> 7 человек"
              checked={interviewData.coreTeamSize === '> 7'}
              onChange={(e) => setInterviewData({ coreTeamSize: e.target.value })}
            />
          </div>
        </FormGroup>

        <FormGroup 
          label="Процессная зрелость" 
          htmlFor="processMaturity"
          helper="Есть ли описанные бизнес-процессы по теме проекта?"
        >
          <div className="mt-1 space-y-2">
            <RadioOption
              id="process-1"
              name="processMaturity"
              value="Полные BPMN"
              label="Полные BPMN - детальные процессные модели"
              checked={interviewData.processMaturity === 'Полные BPMN'}
              onChange={(e) => setInterviewData({ processMaturity: e.target.value })}
            />
            <RadioOption
              id="process-2"
              name="processMaturity"
              value="Частичные схемы"
              label="Частичные схемы - есть некоторые описания процессов"
              checked={interviewData.processMaturity === 'Частичные схемы'}
              onChange={(e) => setInterviewData({ processMaturity: e.target.value })}
            />
            <RadioOption
              id="process-3"
              name="processMaturity"
              value="Ничего"
              label="Ничего - процессы не формализованы"
              checked={interviewData.processMaturity === 'Ничего'}
              onChange={(e) => setInterviewData({ processMaturity: e.target.value })}
            />
          </div>
        </FormGroup>

        <FormGroup 
          label="Методологические предпочтения" 
          htmlFor="preferredStyle"
          helper="Какой методологический подход предпочтителен?"
        >
          <div className="mt-1 space-y-2">
            <RadioOption
              id="style-1"
              name="preferredStyle"
              value="Нет, подскажите"
              label="Нет, подскажите - нет явных предпочтений"
              checked={interviewData.preferredStyle === 'Нет, подскажите'}
              onChange={(e) => setInterviewData({ preferredStyle: e.target.value })}
            />
            <RadioOption
              id="style-2"
              name="preferredStyle"
              value="Классический (PMBOK)"
              label="Классический (PMBOK) - традиционный подход к управлению проектами"
              checked={interviewData.preferredStyle === 'Классический (PMBOK)'}
              onChange={(e) => setInterviewData({ preferredStyle: e.target.value })}
            />
            <RadioOption
              id="style-3"
              name="preferredStyle"
              value="Agile/Scrum"
              label="Agile/Scrum - гибкий итеративный подход"
              checked={interviewData.preferredStyle === 'Agile/Scrum'}
              onChange={(e) => setInterviewData({ preferredStyle: e.target.value })}
            />
            <RadioOption
              id="style-4"
              name="preferredStyle"
              value="Lean / Kaizen"
              label="Lean / Kaizen - постепенное улучшение процессов"
              checked={interviewData.preferredStyle === 'Lean / Kaizen'}
              onChange={(e) => setInterviewData({ preferredStyle: e.target.value })}
            />
            <RadioOption
              id="style-5"
              name="preferredStyle"
              value="Six Sigma/BPMN"
              label="Six Sigma/BPMN - улучшение бизнес-процессов"
              checked={interviewData.preferredStyle === 'Six Sigma/BPMN'}
              onChange={(e) => setInterviewData({ preferredStyle: e.target.value })}
            />
            <RadioOption
              id="style-6"
              name="preferredStyle"
              value="Гибрид"
              label="Гибрид - смешанный подход"
              checked={interviewData.preferredStyle === 'Гибрид'}
              onChange={(e) => setInterviewData({ preferredStyle: e.target.value })}
            />
          </div>
        </FormGroup>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </InterviewStep>

      {/* Шаг 6: Рисковый профиль */}
      <InterviewStep
        title="Рисковый профиль"
        description="Определите уровень допустимой неопределённости и скорость изменений."
        currentStep={currentStep}
        stepNumber={5}
      >
        <FormGroup 
          label="Допустимый уровень неопределённости" 
          htmlFor="riskTolerance"
          helper="Насколько команда и заказчик готовы к изменениям и неопределённости?"
        >
          <div className="mt-1 space-y-2">
            <RadioOption
              id="risk-1"
              name="riskTolerance"
              value="Минимальный"
              label="Минимальный - нужен стабильный план с минимумом изменений"
              checked={interviewData.riskTolerance === 'Минимальный'}
              onChange={(e) => setInterviewData({ riskTolerance: e.target.value })}
            />
            <RadioOption
              id="risk-2"
              name="riskTolerance"
              value="Средний"
              label="Средний - готовы к умеренным изменениям в ходе проекта"
              checked={interviewData.riskTolerance === 'Средний'}
              onChange={(e) => setInterviewData({ riskTolerance: e.target.value })}
            />
            <RadioOption
              id="risk-3"
              name="riskTolerance"
              value="Высокий"
              label="Высокий - готовы к быстрым экспериментам и частым изменениям"
              checked={interviewData.riskTolerance === 'Высокий'}
              onChange={(e) => setInterviewData({ riskTolerance: e.target.value })}
            />
          </div>
        </FormGroup>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </InterviewStep>

      {/* Шаг 7: Исходные материалы и комментарии */}
      <InterviewStep
        title="Исходные материалы и дополнительная информация"
        description="Укажите доступные исходные материалы и любую другую информацию."
        currentStep={currentStep}
        stepNumber={6}
      >
        <FormGroup 
          label="Доступные артефакты" 
          htmlFor="initialArtifacts"
          helper="Какие документы, схемы или материалы уже есть?"
        >
          <textarea
            id="initialArtifacts"
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.initialArtifacts || ''}
            onChange={(e) => setInterviewData({ initialArtifacts: e.target.value })}
          />
        </FormGroup>

        <FormGroup 
          label="Интеграции с хранилищами" 
          htmlFor="storageLinks"
          helper="Нужно ли подключаться к существующим хранилищам (SharePoint, G-Drive, Jira)?"
        >
          <textarea
            id="storageLinks"
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.storageLinks || ''}
            onChange={(e) => setInterviewData({ storageLinks: e.target.value })}
          />
        </FormGroup>

        <FormGroup 
          label="Дополнительные комментарии" 
          htmlFor="notes"
          helper="Что ещё важно знать ассистенту о проекте?"
        >
          <textarea
            id="notes"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={interviewData.notes || ''}
            onChange={(e) => setInterviewData({ notes: e.target.value })}
          />
        </FormGroup>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
          isLastStep
        />
      </InterviewStep>

      {/* Анализ и результаты */}
      {currentStep >= totalSteps && <AnalysisResults />}
    </div>
  );
};

// Обертка для страницы с провайдером контекста
export default function InterviewPage() {
  return (
    <InterviewProvider>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Создание нового проекта</h1>
          <p className="text-gray-600">
            Пройдите короткое интервью, чтобы BA Assist мог подготовить оптимальную структуру проекта для вас.
          </p>
        </div>
        <InterviewWizard />
      </div>
    </InterviewProvider>
  );
}