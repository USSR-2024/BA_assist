/**
 * Сервис для работы с ИИ (OpenAI API)
 * Используется для генерации рекомендаций по фреймворкам и дорожным картам
 */

import { createLogger } from './logger';
import { prisma } from './prisma';
import { ENV } from './env';
import { InterviewData, AnalysisResults, RoadmapPhase } from '@/app/contexts/InterviewContext';

const logger = createLogger('AI-Service');

// Поддерживаемые модели OpenAI
export enum OpenAIModel {
  GPT3_5_TURBO = 'gpt-3.5-turbo',
  GPT4 = 'gpt-4',
  GPT4_TURBO = 'gpt-4-turbo-preview'
}

// Настройки OpenAI
export interface OpenAISettings {
  apiKey?: string;
  model: OpenAIModel;
  temperature?: number;
  maxTokens?: number;
}

// Интерфейс для OpenAI запроса
interface OpenAICompletionRequest {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

// Интерфейс для OpenAI ответа
interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Интерфейс для работы с OpenAI API
class OpenAIClient {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  
  constructor(settings: OpenAISettings) {
    // Используем системный API ключ из переменных окружения
    this.apiKey = ENV.OPENAI_API_KEY;
    // Если модель указана в настройках, используем её, иначе берём из переменных окружения
    this.model = settings.model || ENV.OPENAI_MODEL as OpenAIModel;
    this.temperature = settings.temperature || 0.7;
    this.maxTokens = settings.maxTokens || 1500;
  }
  
  async createCompletion(prompt: string, systemPrompt: string = ''): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API ключ OpenAI не настроен в переменных окружения');
    }
    
    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt || 'Вы — полезный ИИ ассистент для бизнес-аналитиков.' },
        { role: 'user' as const, content: prompt }
      ];
      
      const requestBody: OpenAICompletionRequest = {
        model: this.model,
        messages,
        temperature: this.temperature,
      };
      
      if (this.maxTokens > 0) {
        requestBody.max_tokens = this.maxTokens;
      }
      
      logger.info(`Отправка запроса к OpenAI (модель: ${this.model})`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        logger.error('Ошибка OpenAI API:', error);
        throw new Error(`OpenAI API ошибка: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as OpenAICompletionResponse;
      return data.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Ошибка при вызове OpenAI API:', error);
      throw error;
    }
  }
}

export class AIService {
  /**
   * Получает настройки OpenAI
   * @returns Настройки OpenAI из переменных окружения
   */
  static getOpenAISettings(): OpenAISettings {
    return {
      model: ENV.OPENAI_MODEL as OpenAIModel || OpenAIModel.GPT3_5_TURBO,
      temperature: 0.7,
      maxTokens: 1500
    };
  }
  
  /**
   * Создает экземпляр OpenAI клиента
   * @param customSettings - Необязательные кастомные настройки
   * @returns OpenAI клиент
   */
  static createOpenAIClient(customSettings?: Partial<OpenAISettings>): OpenAIClient {
    const defaultSettings = this.getOpenAISettings();
    const settings = {
      ...defaultSettings,
      ...customSettings
    };
    return new OpenAIClient(settings);
  }
  
  /**
   * Проверяет, настроен ли OpenAI API
   * @returns true, если API ключ настроен
   */
  static isOpenAIConfigured(): boolean {
    return ENV.openaiConfigured;
  }

  /**
   * Анализирует данные интервью с помощью ИИ
   * @param interviewData - данные из мини-интервью
   * @param customModel - опциональная модель для использования (вместо модели по умолчанию)
   * @returns результаты анализа
   */
  static async analyzeInterviewWithAI(
    interviewData: InterviewData,
    customModel?: OpenAIModel
  ): Promise<AnalysisResults> {
    try {
      logger.info('Начинаем анализ интервью с помощью ИИ');
      
      // Проверяем, настроен ли OpenAI API
      if (this.isOpenAIConfigured()) {
        try {
          const customSettings = customModel ? { model: customModel } : undefined;
          const client = this.createOpenAIClient(customSettings);
          
          // Формируем промпт для OpenAI на основе данных интервью
          const prompt = `
            Пожалуйста, проанализируй следующие данные по бизнес-проекту и порекомендуй подходящую методологию/фреймворк для его реализации:
            
            Название проекта: ${interviewData.title}
            Спонсор: ${interviewData.sponsor || 'Не указано'}
            Бизнес-владелец: ${interviewData.businessOwner || 'Не указано'}
            Бизнес-потребность: ${interviewData.businessNeed || 'Не указано'}
            Критерии успеха: ${interviewData.successMetrics || 'Не указано'}
            Области охвата: ${interviewData.scopeAreas || 'Не указано'}
            Вне области охвата: ${interviewData.outOfScope || 'Не указано'}
            Ожидаемые результаты: ${interviewData.deliverables || 'Не указано'}
            Ограничения: ${interviewData.constraints || 'Не указано'}
            Целевая дата: ${interviewData.targetDate ? new Date(interviewData.targetDate).toLocaleDateString('ru-RU') : 'Не указано'}
            Ожидаемая длительность: ${interviewData.durationBucket || 'Не указано'}
            Размер основной команды: ${interviewData.coreTeamSize || 'Не указано'}
            Зрелость процессов: ${interviewData.processMaturity || 'Не указано'}
            Предпочитаемый стиль: ${interviewData.preferredStyle || 'Не указано'}
            Толерантность к риску: ${interviewData.riskTolerance || 'Не указано'}
            
            Ответ предоставь в формате JSON со следующими полями:
            1. framework: название рекомендуемого фреймворка
            2. roadmap: массив фаз проекта, где каждая фаза включает:
               - phase: название фазы
               - weeks: ожидаемая длительность в неделях
               - artifacts: массив основных артефактов фазы
            3. storageRules: рекомендации по классификации документов проекта
          `;
          
          const systemPrompt = `Ты — опытный бизнес-аналитик, который помогает выбрать оптимальный фреймворк и дорожную карту для проектов. Доступные фреймворки: "Discovery-First", "Design Sprint / PoC Canvas", "Scrum-BA track", "PMBOK-Lite", "BPM Re-Engineering", "MVP Fast-Track", "Standard BABOK Framework".`;
          
          // Получаем ответ от OpenAI
          const response = await client.createCompletion(prompt, systemPrompt);
          
          try {
            // Парсим ответ как JSON
            const result = JSON.parse(response);
            
            logger.info(`Анализ завершен. Выбран фреймворк: ${result.framework}`);
            
            return {
              framework: result.framework,
              roadmap: result.roadmap,
              storageRules: result.storageRules
            };
          } catch (parseError) {
            logger.error('Ошибка при парсинге ответа OpenAI:', parseError);
            throw new Error('Не удалось распарсить ответ ИИ');
          }
        } catch (aiError) {
          logger.error('Ошибка при вызове OpenAI API:', aiError);
          // В случае ошибки OpenAI, используем локальную логику
        }
      } else {
        logger.info('OpenAI API не настроен. Используем локальную логику.');
      }
      
      // Если не удалось использовать OpenAI или API не настроен,
      // используем локальную логику
      const framework = this.selectFramework(interviewData);
      const roadmap = await this.generateRoadmap(framework, interviewData);
      const storageRules = await this.generateStorageRules(interviewData);
      
      logger.info(`Анализ завершен. Выбран фреймворк: ${framework}`);
      
      return {
        framework,
        roadmap,
        storageRules
      };
    } catch (error) {
      logger.error('Ошибка при анализе интервью с помощью ИИ:', error);
      
      // В случае ошибки возвращаем базовый фреймворк
      return {
        framework: 'Standard BABOK Framework',
        roadmap: await this.generateRoadmap('Standard BABOK Framework', interviewData),
        storageRules: 'Автоклассификация по ключевым словам из названия проекта'
      };
    }
  }
  
  /**
   * Генерирует саммари проекта на основе его данных
   * @param projectData - данные проекта
   * @param customModel - опциональная модель для использования (вместо модели по умолчанию)
   * @returns сгенерированное саммари
   */
  static async generateProjectSummary(
    projectData: any,
    customModel?: OpenAIModel
  ): Promise<string> {
    try {
      logger.info('Генерация саммари проекта');
      
      // Проверяем, настроен ли OpenAI API
      if (this.isOpenAIConfigured()) {
        try {
          const customSettings = customModel ? { model: customModel } : undefined;
          const client = this.createOpenAIClient(customSettings);
          
          // Формируем промпт для OpenAI на основе данных проекта
          const prompt = `
            Создай краткое, но информативное описание для следующего проекта:
            
            Название проекта: ${projectData.title}
            Описание: ${projectData.description || 'Не указано'}
            Бизнес-потребность: ${projectData.businessNeed || 'Не указано'}
            Критерии успеха: ${projectData.successMetrics || 'Не указано'}
            Области охвата: ${projectData.scopeAreas || 'Не указано'}
            Ожидаемые результаты: ${projectData.deliverables || 'Не указано'}
            Рекомендуемый фреймворк: ${projectData.framework || 'Не указано'}
            
            Описание должно быть структурированным и содержательным.
          `;
          
          const systemPrompt = `Ты — опытный бизнес-аналитик, который создает четкие и информативные описания проектов. Твои описания помогают заинтересованным сторонам быстро понять суть проекта.`;
          
          // Получаем ответ от OpenAI
          return await client.createCompletion(prompt, systemPrompt);
        } catch (aiError) {
          logger.error('Ошибка при вызове OpenAI API:', aiError);
          // В случае ошибки OpenAI, используем локальную логику
        }
      } else {
        logger.info('OpenAI API не настроен. Используем локальную логику.');
      }
      
      // Если не удалось использовать OpenAI или API не настроен,
      // используем локальную логику
      let summary = `Проект "${projectData.title}"\n\n`;
      
      if (projectData.description) {
        summary += `${projectData.description}\n\n`;
      }
      
      if (projectData.businessNeed) {
        summary += `Бизнес-потребность: ${projectData.businessNeed}\n\n`;
      }
      
      if (projectData.framework) {
        summary += `Рекомендуемый фреймворк: ${projectData.framework}\n\n`;
      }
      
      if (projectData.deliverables) {
        summary += `Ожидаемые результаты: ${projectData.deliverables}\n\n`;
      }
      
      if (projectData.successMetrics) {
        summary += `Критерии успеха: ${projectData.successMetrics}\n\n`;
      }
      
      return summary;
    } catch (error) {
      logger.error('Ошибка при генерации саммари проекта:', error);
      return `Проект "${projectData.title}"\n\nОписание будет сгенерировано позже.`;
    }
  }

  /**
   * Выбирает подходящий фреймворк на основе ответов интервью
   * В реальной имплементации это будет делать ИИ
   */
  private static selectFramework(data: InterviewData): string {
    // Логика выбора фреймворка согласно предоставленной таблице
    if (data.processMaturity === 'Ничего') {
      return 'Discovery-First';
    }

    if (data.durationBucket === '≤ 1 мес (Spike/PoC)') {
      return 'Design Sprint / PoC Canvas';
    }

    if (
      data.preferredStyle === 'Agile/Scrum' || 
      (data.coreTeamSize === '4-7' || data.coreTeamSize === '> 7')
    ) {
      return 'Scrum-BA track';
    }

    if (data.riskTolerance === 'Минимальный') {
      return 'PMBOK-Lite';
    }

    if (
      data.processMaturity === 'Полные BPMN' && 
      data.scopeAreas && 
      data.scopeAreas.includes(',')
    ) {
      return 'BPM Re-Engineering';
    }

    if (data.targetDate) {
      const targetDate = new Date(data.targetDate);
      const now = new Date();
      const diffTime = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 90) {
        return 'MVP Fast-Track';
      }
    }

    // Если не выбран ни один фреймворк, используем стандартный
    return 'Standard BABOK Framework';
  }

  /**
   * Генерирует дорожную карту на основе выбранного фреймворка
   * В реальной имплементации это будет делать ИИ
   */
  private static async generateRoadmap(framework: string, data: InterviewData): Promise<RoadmapPhase[]> {
    // Шаблоны дорожных карт для разных фреймворков
    const roadmapTemplates: { [key: string]: RoadmapPhase[] } = {
      'Discovery-First': [
        { phase: 'Stakeholder Analysis', weeks: 1, artifacts: ['Stakeholder Map', 'RACI Matrix', 'Stakeholder Analysis'] },
        { phase: 'Process Discovery', weeks: 2, artifacts: ['High-level AS-IS (IDEF0)', 'Process Inventory', 'Pain Points Log'] },
        { phase: 'Quick-wins Planning', weeks: 1, artifacts: ['Quick-wins Backlog', 'Implementation Plan', 'ROI Estimation'] }
      ],
      
      'Design Sprint / PoC Canvas': [
        { phase: 'Understand', weeks: 0.5, artifacts: ['Problem Statement', 'User Personas', 'Expert Interviews'] },
        { phase: 'Diverge', weeks: 0.5, artifacts: ['Sketches', 'Crazy 8s', 'Solution Ideas'] },
        { phase: 'Decide', weeks: 0.5, artifacts: ['Solution Storyboard', 'Decision Matrix', 'Prototype Plan'] },
        { phase: 'Prototype', weeks: 1, artifacts: ['PoC Prototype', 'Test Script', 'Lean Canvas'] },
        { phase: 'Validate', weeks: 0.5, artifacts: ['User Feedback', 'Findings Report', 'Next Steps Plan'] }
      ],
      
      'Scrum-BA track': [
        { phase: 'Product Vision', weeks: 1, artifacts: ['Product Vision Board', 'Impact Mapping', 'SWOT Analysis'] },
        { phase: 'Backlog Preparation', weeks: 1, artifacts: ['User Story Mapping', 'Epic Breakdown', 'Definition of Ready'] },
        { phase: 'Sprint Planning', weeks: 0.5, artifacts: ['Sprint Backlog', 'Acceptance Criteria', 'Story Pointing'] },
        { phase: 'Sprint Execution (x3)', weeks: 6, artifacts: ['Working Increment', 'Sprint Review Notes', 'Product Backlog Refinement'] },
        { phase: 'Release Planning', weeks: 0.5, artifacts: ['Release Plan', 'Feature Prioritization', 'Rollout Strategy'] }
      ],
      
      'PMBOK-Lite': [
        { phase: 'Project Initiation', weeks: 1, artifacts: ['Project Charter', 'Stakeholder Register', 'Communication Plan'] },
        { phase: 'Planning', weeks: 2, artifacts: ['Scope Statement', 'WBS', 'RACI Matrix', 'Risk Register'] },
        { phase: 'Requirements', weeks: 2, artifacts: ['Business Requirements Document', 'Use Cases', 'Process Flows'] },
        { phase: 'Design', weeks: 2, artifacts: ['Solution Design', 'Technical Requirements', 'Data Model'] },
        { phase: 'Implementation', weeks: 4, artifacts: ['Test Cases', 'Training Materials', 'Implementation Plan'] },
        { phase: 'Closure', weeks: 1, artifacts: ['Acceptance Document', 'Lessons Learned', 'Project Closure Report'] }
      ],
      
      'BPM Re-Engineering': [
        { phase: 'AS-IS Analysis', weeks: 2, artifacts: ['Process Inventory', 'AS-IS BPMN', 'Process Performance Metrics'] },
        { phase: 'Process Diagnosis', weeks: 1, artifacts: ['Value-added Analysis', 'Root Cause Analysis', 'Opportunity Assessment'] },
        { phase: 'TO-BE Design', weeks: 2, artifacts: ['TO-BE BPMN', 'KPI Definition', 'Gap Analysis'] },
        { phase: 'Process Simulation', weeks: 1, artifacts: ['Simulation Report', 'Resource Modeling', 'Cost-Benefit Analysis'] },
        { phase: 'Implementation Planning', weeks: 1, artifacts: ['Implementation Roadmap', 'Change Management Plan', 'Process Governance Model'] },
        { phase: 'Pilot & Rollout', weeks: 3, artifacts: ['Pilot Results', 'Process Documentation', 'Training Materials'] }
      ],
      
      'MVP Fast-Track': [
        { phase: 'Discovery', weeks: 1, artifacts: ['Stakeholder Map', 'Business Need Statement', 'Light Business Case'] },
        { phase: 'Analysis', weeks: 2, artifacts: ['AS-IS Process Sketch', 'Problem Backlog', 'Value Stream Map'] },
        { phase: 'Design & Build', weeks: 4, artifacts: ['User-Story Map', 'Product Backlog', 'MVP Prototype'] },
        { phase: 'Pilot & Evaluate', weeks: 2, artifacts: ['UAT Report', 'Solution Health Metrics', 'Go-/No-Go Deck'] }
      ],
      
      'Standard BABOK Framework': [
        { phase: 'Business Analysis Planning', weeks: 1, artifacts: ['BA Plan', 'Stakeholder Analysis', 'Communication Plan'] },
        { phase: 'Requirements Elicitation', weeks: 2, artifacts: ['Elicitation Results', 'Interviews', 'Workshops'] },
        { phase: 'Requirements Analysis', weeks: 2, artifacts: ['Requirements Document', 'Process Models', 'Data Dictionary'] },
        { phase: 'Solution Design', weeks: 2, artifacts: ['Solution Scope', 'Feature Models', 'Functional Specifications'] },
        { phase: 'Solution Evaluation', weeks: 1, artifacts: ['Test Plan', 'Acceptance Criteria', 'Traceability Matrix'] }
      ]
    };

    // В реальной имплементации здесь был бы запрос к OpenAI для генерации
    // кастомизированной дорожной карты на основе выбранного фреймворка и данных интервью
    
    // Для MVP возвращаем шаблон дорожной карты для выбранного фреймворка
    return roadmapTemplates[framework] || roadmapTemplates['Standard BABOK Framework'];
  }

  /**
   * Генерирует правила хранения на основе данных интервью
   * В реальной имплементации это будет делать ИИ
   */
  private static async generateStorageRules(data: InterviewData): Promise<string> {
    let rules = 'Auto-tag incoming files based on: ';
    
    // Добавляем ключевые слова из названия проекта
    if (data.title) {
      const keywords = data.title
        .split(' ')
        .filter(word => word.length > 3)
        .map(word => word.toLowerCase());
      
      if (keywords.length > 0) {
        rules += `Project keywords: ${keywords.join(', ')}; `;
      }
    }
    
    // Добавляем правила для бизнес-потребности
    if (data.businessNeed) {
      const needKeywords = data.businessNeed
        .split(' ')
        .filter(word => word.length > 4)
        .slice(0, 3)
        .map(word => word.toLowerCase());
      
      if (needKeywords.length > 0) {
        rules += `Business need: ${needKeywords.join(', ')}; `;
      }
    }
    
    // Правила для классификации по фазам дорожной карты
    rules += 'Route to appropriate phase folder based on content matching.';
    
    return rules;
  }
}