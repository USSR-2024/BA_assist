import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Создает начальные фреймворки и их фазы для приложения
 */
async function seedFrameworks() {
  console.log('Создание начальных фреймворков...');
  
  try {
    // Проверяем, есть ли уже записи
    const count = await prisma.framework.count();
    
    if (count > 0) {
      console.log(`Фреймворки уже существуют (${count} записей). Пропускаем создание.`);
      return;
    }
    
    // BPM Re-engineering фреймворк
    const bpmFramework = await prisma.framework.create({
      data: {
        id: 'bpm-reengineering',
        name: 'BPM Re-engineering',
        ruName: 'BPM Реинжиниринг',
        description: 'Framework for business process re-engineering projects',
        ruDescription: 'Фреймворк для проектов по реинжинирингу бизнес-процессов',
        methodologyTag: ['bpm', 'reengineering', 'optimization'],
        isDefault: true,
        isSystem: true,
        isCustom: false,
        suitabilityCriteria: {
          complexity: 'medium',
          teamSize: '3-7',
          duration: '2-6 months'
        },
      }
    });

    // PMBOK-Lite фреймворк
    const pmbokFramework = await prisma.framework.create({
      data: {
        id: 'pmbok-lite',
        name: 'PMBOK-Lite',
        ruName: 'PMBOK-Лайт',
        description: 'Simplified PMBOK framework for medium projects',
        ruDescription: 'Упрощенный PMBOK-фреймворк для средних проектов',
        methodologyTag: ['pmbok', 'waterfall', 'traditional'],
        isDefault: false,
        isSystem: true,
        isCustom: false,
        suitabilityCriteria: {
          complexity: 'medium-high',
          teamSize: '5-15',
          duration: '3-12 months'
        },
      }
    });

    // Scrum-BA Track фреймворк
    const scrumFramework = await prisma.framework.create({
      data: {
        id: 'scrum-ba-track',
        name: 'Scrum-BA Track',
        ruName: 'Scrum для бизнес-аналитиков',
        description: 'Agile framework focused on BA activities',
        ruDescription: 'Agile-фреймворк с фокусом на работу бизнес-аналитиков',
        methodologyTag: ['agile', 'scrum', 'iterative'],
        isDefault: false,
        isSystem: true,
        isCustom: false,
        suitabilityCriteria: {
          complexity: 'medium',
          teamSize: '3-9',
          duration: '1-6 months'
        },
      }
    });

    // Lean/Six Sigma фреймворк
    const leanFramework = await prisma.framework.create({
      data: {
        id: 'lean-six-sigma',
        name: 'Lean/Six Sigma',
        ruName: 'Бережливое производство/Шесть сигм',
        description: 'Quality improvement and waste reduction framework',
        ruDescription: 'Фреймворк для улучшения качества и снижения потерь',
        methodologyTag: ['lean', 'six-sigma', 'quality', 'optimization'],
        isDefault: false,
        isSystem: true,
        isCustom: false,
        suitabilityCriteria: {
          complexity: 'high',
          teamSize: '4-10',
          duration: '3-12 months'
        },
      }
    });

    // Создаем фазы для BPM Re-engineering
    await prisma.phase.createMany({
      data: [
        {
          id: 'bpm-phase-1',
          frameworkId: bpmFramework.id,
          name: 'Analysis and Process Discovery',
          ruName: 'Анализ и исследование процессов',
          order: 1,
          description: 'Identify and document current processes',
          ruDescription: 'Определение и документирование текущих процессов',
          durationWeeks: 3
        },
        {
          id: 'bpm-phase-2',
          frameworkId: bpmFramework.id,
          name: 'Process Redesign',
          ruName: 'Редизайн процессов',
          order: 2,
          description: 'Redesigning processes for optimization',
          ruDescription: 'Перепроектирование процессов для оптимизации',
          durationWeeks: 4
        },
        {
          id: 'bpm-phase-3',
          frameworkId: bpmFramework.id,
          name: 'Implementation Planning',
          ruName: 'Планирование внедрения',
          order: 3,
          description: 'Planning the implementation of redesigned processes',
          ruDescription: 'Планирование внедрения перепроектированных процессов',
          durationWeeks: 2
        },
        {
          id: 'bpm-phase-4',
          frameworkId: bpmFramework.id,
          name: 'Change Management and Rollout',
          ruName: 'Управление изменениями и развертывание',
          order: 4,
          description: 'Implementing changes and managing transition',
          ruDescription: 'Внедрение изменений и управление переходом',
          durationWeeks: 4
        }
      ]
    });

    // Создаем фазы для PMBOK-Lite
    await prisma.phase.createMany({
      data: [
        {
          id: 'pmbok-phase-1',
          frameworkId: pmbokFramework.id,
          name: 'Initiation',
          ruName: 'Инициация',
          order: 1,
          description: 'Define project goals and scope',
          ruDescription: 'Определение целей и рамок проекта',
          durationWeeks: 2
        },
        {
          id: 'pmbok-phase-2',
          frameworkId: pmbokFramework.id,
          name: 'Planning',
          ruName: 'Планирование',
          order: 2,
          description: 'Detailed project planning',
          ruDescription: 'Детальное планирование проекта',
          durationWeeks: 3
        },
        {
          id: 'pmbok-phase-3',
          frameworkId: pmbokFramework.id,
          name: 'Execution',
          ruName: 'Исполнение',
          order: 3,
          description: 'Project execution according to plans',
          ruDescription: 'Выполнение проекта согласно планам',
          durationWeeks: 8
        },
        {
          id: 'pmbok-phase-4',
          frameworkId: pmbokFramework.id,
          name: 'Monitoring and Control',
          ruName: 'Мониторинг и контроль',
          order: 4,
          description: 'Monitoring progress and making adjustments',
          ruDescription: 'Отслеживание прогресса и внесение корректировок',
          durationWeeks: 10
        },
        {
          id: 'pmbok-phase-5',
          frameworkId: pmbokFramework.id,
          name: 'Closing',
          ruName: 'Закрытие',
          order: 5,
          description: 'Project completion and lessons learned',
          ruDescription: 'Завершение проекта и анализ полученного опыта',
          durationWeeks: 2
        }
      ]
    });

    // Создаем фазы для Scrum-BA Track
    await prisma.phase.createMany({
      data: [
        {
          id: 'scrum-phase-1',
          frameworkId: scrumFramework.id,
          name: 'Product Backlog Creation',
          ruName: 'Создание бэклога продукта',
          order: 1,
          description: 'Creating and prioritizing the product backlog',
          ruDescription: 'Создание и приоритизация бэклога продукта',
          durationWeeks: 2
        },
        {
          id: 'scrum-phase-2',
          frameworkId: scrumFramework.id,
          name: 'Sprint Planning',
          ruName: 'Планирование спринта',
          order: 2,
          description: 'Planning the sprint goals and tasks',
          ruDescription: 'Планирование целей и задач спринта',
          durationWeeks: 1
        },
        {
          id: 'scrum-phase-3',
          frameworkId: scrumFramework.id,
          name: 'Sprint Execution',
          ruName: 'Выполнение спринта',
          order: 3,
          description: 'Executing sprint activities and tasks',
          ruDescription: 'Выполнение задач и активностей спринта',
          durationWeeks: 2
        },
        {
          id: 'scrum-phase-4',
          frameworkId: scrumFramework.id,
          name: 'Sprint Review',
          ruName: 'Обзор спринта',
          order: 4,
          description: 'Reviewing sprint results and product increment',
          ruDescription: 'Обзор результатов спринта и инкремента продукта',
          durationWeeks: 0.5
        },
        {
          id: 'scrum-phase-5',
          frameworkId: scrumFramework.id,
          name: 'Sprint Retrospective',
          ruName: 'Ретроспектива спринта',
          order: 5,
          description: 'Analyzing process improvement opportunities',
          ruDescription: 'Анализ возможностей улучшения процесса',
          durationWeeks: 0.5
        }
      ]
    });

    // Создаем фазы для Lean/Six Sigma
    await prisma.phase.createMany({
      data: [
        {
          id: 'lean-phase-1',
          frameworkId: leanFramework.id,
          name: 'Define',
          ruName: 'Определение',
          order: 1,
          description: 'Define the problem and project goals',
          ruDescription: 'Определение проблемы и целей проекта',
          durationWeeks: 2
        },
        {
          id: 'lean-phase-2',
          frameworkId: leanFramework.id,
          name: 'Measure',
          ruName: 'Измерение',
          order: 2,
          description: 'Collect data and establish baseline metrics',
          ruDescription: 'Сбор данных и определение базовых метрик',
          durationWeeks: 3
        },
        {
          id: 'lean-phase-3',
          frameworkId: leanFramework.id,
          name: 'Analyze',
          ruName: 'Анализ',
          order: 3,
          description: 'Analyze data to identify root causes',
          ruDescription: 'Анализ данных для выявления корневых причин',
          durationWeeks: 4
        },
        {
          id: 'lean-phase-4',
          frameworkId: leanFramework.id,
          name: 'Improve',
          ruName: 'Улучшение',
          order: 4,
          description: 'Implement solutions and improvements',
          ruDescription: 'Внедрение решений и улучшений',
          durationWeeks: 6
        },
        {
          id: 'lean-phase-5',
          frameworkId: leanFramework.id,
          name: 'Control',
          ruName: 'Контроль',
          order: 5,
          description: 'Ensure sustained improvement through control measures',
          ruDescription: 'Обеспечение устойчивого улучшения через контрольные меры',
          durationWeeks: 3
        }
      ]
    });

    console.log('Начальные фреймворки и фазы успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании фреймворков:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Если файл запущен напрямую (не импортирован)
if (require.main === module) {
  seedFrameworks();
}

export { seedFrameworks };