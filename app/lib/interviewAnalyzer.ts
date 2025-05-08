import { InterviewData, AnalysisResults, RoadmapPhase } from '@/app/contexts/InterviewContext';

/**
 * Анализатор данных интервью
 * Выбирает подходящий фреймворк и генерирует дорожную карту
 */
export class InterviewAnalyzer {
  /**
   * Анализирует данные интервью и возвращает результаты
   */
  static analyzeInterview(data: InterviewData): AnalysisResults {
    const framework = this.selectFramework(data);
    const roadmap = this.generateRoadmap(framework, data);
    const storageRules = this.generateStorageRules(data);

    return {
      framework,
      roadmap,
      storageRules
    };
  }

  /**
   * Выбирает подходящий фреймворк на основе ответов интервью
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
   */
  private static generateRoadmap(framework: string, data: InterviewData): RoadmapPhase[] {
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

    // Возвращаем дорожную карту для выбранного фреймворка 
    // или стандартную, если для выбранного фреймворка нет шаблона
    return roadmapTemplates[framework] || roadmapTemplates['Standard BABOK Framework'];
  }

  /**
   * Генерирует правила хранения на основе данных интервью
   */
  private static generateStorageRules(data: InterviewData): string {
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