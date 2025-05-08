'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Тип для данных интервью
export interface InterviewData {
  // Основные сведения
  title: string;
  description?: string;
  sponsor?: string;
  businessOwner?: string;
  
  // Цель и ценность
  businessNeed?: string;
  successMetrics?: string;
  
  // Масштаб и ограничения
  scopeAreas?: string;
  outOfScope?: string;
  deliverables?: string;
  constraints?: string;
  
  // Временные параметры
  targetDate?: string;
  durationBucket?: string;
  
  // Ресурсы и зрелость
  coreTeamSize?: string;
  processMaturity?: string;
  preferredStyle?: string;
  
  // Рисковый профиль
  riskTolerance?: string;
  
  // Исходные материалы
  initialArtifacts?: string;
  storageLinks?: string;
  
  // Дополнительная информация
  notes?: string;
}

// Структура дорожной карты
export interface RoadmapPhase {
  phase: string;
  weeks: number;
  artifacts: string[];
}

// Результаты анализа интервью
export interface AnalysisResults {
  framework: string;
  roadmap: RoadmapPhase[];
  storageRules: string;
}

// Контекст для данных интервью
interface InterviewContextType {
  interviewData: InterviewData;
  currentStep: number;
  analysisResults: AnalysisResults | null;
  setInterviewData: (data: Partial<InterviewData>) => void;
  setCurrentStep: (step: number) => void;
  setAnalysisResults: (results: AnalysisResults) => void;
  resetInterview: () => void;
}

// Значения по умолчанию
const defaultInterviewData: InterviewData = {
  title: '',
};

const defaultAnalysisResults: AnalysisResults = {
  framework: '',
  roadmap: [],
  storageRules: ''
};

// Создаем контекст
const InterviewContext = createContext<InterviewContextType>({
  interviewData: defaultInterviewData,
  currentStep: 0,
  analysisResults: null,
  setInterviewData: () => {},
  setCurrentStep: () => {},
  setAnalysisResults: () => {},
  resetInterview: () => {},
});

// Провайдер контекста
export const InterviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [interviewData, setInterviewDataState] = useState<InterviewData>(defaultInterviewData);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [analysisResults, setAnalysisResultsState] = useState<AnalysisResults | null>(null);

  // Функция для обновления данных интервью
  const setInterviewData = (data: Partial<InterviewData>) => {
    setInterviewDataState((prev) => ({ ...prev, ...data }));
  };

  // Функция для установки результатов анализа
  const setAnalysisResults = (results: AnalysisResults) => {
    setAnalysisResultsState(results);
  };

  // Функция для сброса интервью
  const resetInterview = () => {
    setInterviewDataState(defaultInterviewData);
    setCurrentStep(0);
    setAnalysisResultsState(null);
  };

  return (
    <InterviewContext.Provider
      value={{
        interviewData,
        currentStep,
        analysisResults,
        setInterviewData,
        setCurrentStep,
        setAnalysisResults,
        resetInterview,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

// Хук для использования контекста
export const useInterview = () => useContext(InterviewContext);