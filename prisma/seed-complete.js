const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createFullArtifactsCatalog } = require('./seeds/artifacts-complete');

async function main() {
  console.log('Начало полного заполнения базы данных...');

  try {
    // 1. Создаем тестового пользователя (admin / admin123)
    await createAdminUser();

    // 2. Создаем бизнес-процессы
    await createBusinessProcesses();

    // 3. Создаем фреймворки и фазы
    await createFrameworks();

    // 4. Создаем каталог артефактов (полный список из 129+ артефактов)
    await createFullArtifactsCatalog();

    // 5. Создаем задачи для фреймворков
    await createFrameworkTasks();

    console.log('Заполнение базы данных успешно завершено!');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Функция создания тестового пользователя
async function createAdminUser() {
  console.log('Создание тестовых пользователей...');
  
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (adminExists) {
      console.log('Тестовый администратор уже существует. Пропускаем создание.');
      return;
    }
    
    // Создаем пользователя (пароль: admin123)
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: '$2b$10$JbWj.fVQBzlpwMOLeQu.XOm//rVJDmEFzB6HoVqqJJJjGmmLWUQBW', // хешированный 'admin123'
        role: 'OWNER',
        isVerified: true
      }
    });
    
    // Создаем обычного пользователя (пароль: user123)
    await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: '$2b$10$kXOKE1hs.uDmULP3pj/SJekbwJyPEBJnhuIUoLFoGQokAiB9ChvJa', // хешированный 'user123'
        role: 'MEMBER',
        isVerified: true
      }
    });
    
    console.log('Тестовые пользователи успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании тестовых пользователей:', error);
    throw error;
  }
}

// Функция создания бизнес-процессов
async function createBusinessProcesses() {
  console.log('Создание бизнес-процессов...');
  
  try {
    const count = await prisma.businessProcess.count();
    
    if (count > 0) {
      console.log(`Бизнес-процессы уже существуют (${count} записей). Пропускаем создание.`);
      return;
    }
    
    // Корневые бизнес-процессы
    const clientProcess = await prisma.businessProcess.create({
      data: {
        title: 'Работа с клиентами',
        description: 'Процессы взаимодействия с клиентами компании'
      }
    });
    
    const productProcess = await prisma.businessProcess.create({
      data: {
        title: 'Разработка продукта',
        description: 'Процессы создания и улучшения продукта'
      }
    });
    
    const financialProcess = await prisma.businessProcess.create({
      data: {
        title: 'Финансы и юридические вопросы',
        description: 'Финансовые и юридические аспекты деятельности компании'
      }
    });
    
    // Дочерние процессы для "Работа с клиентами"
    await prisma.businessProcess.createMany({
      data: [
        {
          title: 'Привлечение клиентов',
          description: 'Маркетинг, реклама, лидогенерация',
          parentId: clientProcess.id
        },
        {
          title: 'Онбординг клиентов',
          description: 'Процесс знакомства новых клиентов с продуктом',
          parentId: clientProcess.id
        },
        {
          title: 'Поддержка клиентов',
          description: 'Обработка обращений, техническая поддержка',
          parentId: clientProcess.id
        }
      ]
    });
    
    // Дочерние процессы для "Разработка продукта"
    await prisma.businessProcess.createMany({
      data: [
        {
          title: 'Сбор требований',
          description: 'Выявление и документирование требований к продукту',
          parentId: productProcess.id
        },
        {
          title: 'Проектирование',
          description: 'Разработка архитектуры и дизайна продукта',
          parentId: productProcess.id
        },
        {
          title: 'Разработка',
          description: 'Непосредственное создание продукта',
          parentId: productProcess.id
        },
        {
          title: 'Тестирование',
          description: 'Проверка качества и соответствия требованиям',
          parentId: productProcess.id
        },
        {
          title: 'Релиз',
          description: 'Выпуск продукта на рынок',
          parentId: productProcess.id
        }
      ]
    });
    
    // Дочерние процессы для "Финансы и юридические вопросы"
    await prisma.businessProcess.createMany({
      data: [
        {
          title: 'Бюджетирование',
          description: 'Планирование и контроль финансовых ресурсов',
          parentId: financialProcess.id
        },
        {
          title: 'Отчетность',
          description: 'Подготовка финансовой отчетности',
          parentId: financialProcess.id
        },
        {
          title: 'Контракты',
          description: 'Работа с договорами и юридическими документами',
          parentId: financialProcess.id
        }
      ]
    });
    
    console.log('Бизнес-процессы успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании бизнес-процессов:', error);
    throw error;
  }
}

// Функция создания фреймворков и фаз
async function createFrameworks() {
  console.log('Создание фреймворков и фаз...');
  
  try {
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
    
    console.log('Фреймворки и фазы успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании фреймворков:', error);
    throw error;
  }
}

// Функция создания артефактов
async function createArtifacts() {
  console.log('Создание каталога артефактов...');
  
  try {
    const count = await prisma.artifactCatalog.count();
    
    if (count > 0) {
      console.log(`Артефакты уже существуют (${count} записей). Пропускаем создание.`);
      return;
    }
    
    await prisma.artifactCatalog.createMany({
      data: [
        {
          id: 'vision-document',
          enName: 'Vision Document',
          ruName: 'Документ концепции',
          babokArea: 'Requirements Analysis and Design Definition',
          stage: 'INITIATION_DISCOVERY',
          description: 'Outlines the vision and objectives of the project',
          format: 'DOCX',
          doneCriteria: 'Approved by stakeholders',
          keywords: ['vision', 'concept', 'scope']
        },
        {
          id: 'business-requirements',
          enName: 'Business Requirements Document',
          ruName: 'Документ бизнес-требований',
          babokArea: 'Requirements Life Cycle Management',
          stage: 'INITIATION_DISCOVERY',
          description: 'Captures high-level business requirements',
          format: 'DOCX',
          doneCriteria: 'Signed off by business stakeholders',
          keywords: ['requirements', 'business', 'needs']
        },
        {
          id: 'process-map',
          enName: 'Process Map',
          ruName: 'Карта процессов',
          babokArea: 'Business Analysis Planning and Monitoring',
          stage: 'ANALYSIS_MODELING',
          description: 'Visual representation of business processes',
          format: 'BPMN',
          doneCriteria: 'Validated by process owners',
          keywords: ['process', 'map', 'flow', 'diagram']
        },
        {
          id: 'data-model',
          enName: 'Data Model',
          ruName: 'Модель данных',
          babokArea: 'Requirements Analysis and Design Definition',
          stage: 'ANALYSIS_MODELING',
          description: 'Describes the structure of data used in the system',
          format: 'PNG',
          doneCriteria: 'Reviewed by technical stakeholders',
          keywords: ['data', 'model', 'structure', 'entities']
        },
        {
          id: 'functional-spec',
          enName: 'Functional Specification',
          ruName: 'Функциональная спецификация',
          babokArea: 'Requirements Analysis and Design Definition',
          stage: 'SOLUTION_DESIGN_PLANNING',
          description: 'Detailed description of system functionality',
          format: 'DOCX',
          doneCriteria: 'Approved by development team',
          keywords: ['functional', 'specification', 'features']
        },
        {
          id: 'test-plan',
          enName: 'Test Plan',
          ruName: 'План тестирования',
          babokArea: 'Solution Evaluation',
          stage: 'SOLUTION_DESIGN_PLANNING',
          description: 'Plan for testing the solution',
          format: 'DOCX',
          doneCriteria: 'Approved by QA team',
          keywords: ['test', 'plan', 'quality', 'verification']
        },
        {
          id: 'implementation-plan',
          enName: 'Implementation Plan',
          ruName: 'План внедрения',
          babokArea: 'Solution Evaluation',
          stage: 'SOLUTION_DESIGN_PLANNING',
          description: 'Plan for implementing the solution',
          format: 'DOCX',
          doneCriteria: 'Approved by project manager',
          keywords: ['implementation', 'plan', 'deployment']
        },
        {
          id: 'post-implementation-review',
          enName: 'Post-Implementation Review',
          ruName: 'Обзор после внедрения',
          babokArea: 'Solution Evaluation',
          stage: 'MONITORING_EVALUATION',
          description: 'Evaluation of the solution after implementation',
          format: 'DOCX',
          doneCriteria: 'Completed by business stakeholders',
          keywords: ['review', 'evaluation', 'post-implementation']
        }
      ]
    });
    
    console.log('Каталог артефактов успешно создан!');
  } catch (error) {
    console.error('Ошибка при создании артефактов:', error);
    throw error;
  }
}

// Функция создания задач для фреймворков
async function createFrameworkTasks() {
  console.log('Создание задач для фреймворков...');
  
  try {
    const count = await prisma.frameworkTask.count();
    
    if (count > 0) {
      console.log(`Задачи фреймворков уже существуют (${count} записей). Пропускаем создание.`);
      return;
    }
    
    // Задачи для BPM Re-engineering
    await prisma.frameworkTask.createMany({
      data: [
        {
          id: 'bpm-task-1',
          frameworkId: 'bpm-reengineering',
          phaseId: 'bpm-phase-1',
          name: 'Document Current Processes',
          ruName: 'Документирование текущих процессов',
          description: 'Identify and document current business processes',
          ruDescription: 'Определение и документирование текущих бизнес-процессов',
          estimatedHours: 20,
          isRequired: true,
          artifactIds: ['process-map'],
          dependsOn: []
        },
        {
          id: 'bpm-task-2',
          frameworkId: 'bpm-reengineering',
          phaseId: 'bpm-phase-1',
          name: 'Analyze Process Performance',
          ruName: 'Анализ производительности процессов',
          description: 'Analyze performance metrics of current processes',
          ruDescription: 'Анализ метрик производительности текущих процессов',
          estimatedHours: 15,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['bpm-task-1']
        },
        {
          id: 'bpm-task-3',
          frameworkId: 'bpm-reengineering',
          phaseId: 'bpm-phase-2',
          name: 'Redesign Process Flow',
          ruName: 'Перепроектирование потока процессов',
          description: 'Redesign process flow for optimization',
          ruDescription: 'Перепроектирование потока процессов для оптимизации',
          estimatedHours: 30,
          isRequired: true,
          artifactIds: ['process-map'],
          dependsOn: ['bpm-task-2']
        },
        {
          id: 'bpm-task-4',
          frameworkId: 'bpm-reengineering',
          phaseId: 'bpm-phase-3',
          name: 'Develop Implementation Plan',
          ruName: 'Разработка плана внедрения',
          description: 'Develop plan for implementing redesigned processes',
          ruDescription: 'Разработка плана внедрения перепроектированных процессов',
          estimatedHours: 20,
          isRequired: true,
          artifactIds: ['implementation-plan'],
          dependsOn: ['bpm-task-3']
        },
        {
          id: 'bpm-task-5',
          frameworkId: 'bpm-reengineering',
          phaseId: 'bpm-phase-4',
          name: 'Train Staff on New Processes',
          ruName: 'Обучение персонала новым процессам',
          description: 'Train staff on new processes and procedures',
          ruDescription: 'Обучение персонала новым процессам и процедурам',
          estimatedHours: 25,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['bpm-task-4']
        }
      ]
    });
    
    // Задачи для PMBOK-Lite
    await prisma.frameworkTask.createMany({
      data: [
        {
          id: 'pmbok-task-1',
          frameworkId: 'pmbok-lite',
          phaseId: 'pmbok-phase-1',
          name: 'Create Project Charter',
          ruName: 'Создание устава проекта',
          description: 'Create the project charter document',
          ruDescription: 'Создание документа устава проекта',
          estimatedHours: 10,
          isRequired: true,
          artifactIds: ['vision-document'],
          dependsOn: []
        },
        {
          id: 'pmbok-task-2',
          frameworkId: 'pmbok-lite',
          phaseId: 'pmbok-phase-1',
          name: 'Identify Stakeholders',
          ruName: 'Определение заинтересованных сторон',
          description: 'Identify key project stakeholders',
          ruDescription: 'Определение ключевых заинтересованных сторон проекта',
          estimatedHours: 8,
          isRequired: true,
          artifactIds: [],
          dependsOn: []
        },
        {
          id: 'pmbok-task-3',
          frameworkId: 'pmbok-lite',
          phaseId: 'pmbok-phase-2',
          name: 'Develop Project Plan',
          ruName: 'Разработка плана проекта',
          description: 'Develop detailed project plan',
          ruDescription: 'Разработка детального плана проекта',
          estimatedHours: 20,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['pmbok-task-1', 'pmbok-task-2']
        },
        {
          id: 'pmbok-task-4',
          frameworkId: 'pmbok-lite',
          phaseId: 'pmbok-phase-2',
          name: 'Create Requirements Document',
          ruName: 'Создание документа требований',
          description: 'Create detailed requirements document',
          ruDescription: 'Создание детального документа требований',
          estimatedHours: 25,
          isRequired: true,
          artifactIds: ['business-requirements', 'functional-spec'],
          dependsOn: ['pmbok-task-2']
        },
        {
          id: 'pmbok-task-5',
          frameworkId: 'pmbok-lite',
          phaseId: 'pmbok-phase-3',
          name: 'Execute Project Activities',
          ruName: 'Выполнение проектных работ',
          description: 'Execute project activities according to plan',
          ruDescription: 'Выполнение проектных работ согласно плану',
          estimatedHours: 100,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['pmbok-task-3', 'pmbok-task-4']
        }
      ]
    });
    
    // Задачи для Scrum-BA Track
    await prisma.frameworkTask.createMany({
      data: [
        {
          id: 'scrum-task-1',
          frameworkId: 'scrum-ba-track',
          phaseId: 'scrum-phase-1',
          name: 'Create Product Backlog',
          ruName: 'Создание бэклога продукта',
          description: 'Create and prioritize product backlog',
          ruDescription: 'Создание и приоритизация бэклога продукта',
          estimatedHours: 15,
          isRequired: true,
          artifactIds: [],
          dependsOn: []
        },
        {
          id: 'scrum-task-2',
          frameworkId: 'scrum-ba-track',
          phaseId: 'scrum-phase-2',
          name: 'Plan Sprint Backlog',
          ruName: 'Планирование бэклога спринта',
          description: 'Plan sprint backlog with team',
          ruDescription: 'Планирование бэклога спринта с командой',
          estimatedHours: 8,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['scrum-task-1']
        },
        {
          id: 'scrum-task-3',
          frameworkId: 'scrum-ba-track',
          phaseId: 'scrum-phase-3',
          name: 'Detail User Stories',
          ruName: 'Детализация пользовательских историй',
          description: 'Detail user stories for development',
          ruDescription: 'Детализация пользовательских историй для разработки',
          estimatedHours: 12,
          isRequired: true,
          artifactIds: ['functional-spec'],
          dependsOn: ['scrum-task-2']
        }
      ]
    });
    
    // Задачи для Lean/Six Sigma
    await prisma.frameworkTask.createMany({
      data: [
        {
          id: 'lean-task-1',
          frameworkId: 'lean-six-sigma',
          phaseId: 'lean-phase-1',
          name: 'Define Problem Statement',
          ruName: 'Определение формулировки проблемы',
          description: 'Define clear problem statement and objectives',
          ruDescription: 'Определение четкой формулировки проблемы и целей',
          estimatedHours: 10,
          isRequired: true,
          artifactIds: ['vision-document'],
          dependsOn: []
        },
        {
          id: 'lean-task-2',
          frameworkId: 'lean-six-sigma',
          phaseId: 'lean-phase-2',
          name: 'Collect Baseline Data',
          ruName: 'Сбор исходных данных',
          description: 'Collect baseline data for process metrics',
          ruDescription: 'Сбор исходных данных для метрик процесса',
          estimatedHours: 20,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['lean-task-1']
        },
        {
          id: 'lean-task-3',
          frameworkId: 'lean-six-sigma',
          phaseId: 'lean-phase-3',
          name: 'Analyze Root Causes',
          ruName: 'Анализ корневых причин',
          description: 'Analyze data to identify root causes',
          ruDescription: 'Анализ данных для выявления корневых причин',
          estimatedHours: 25,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['lean-task-2']
        },
        {
          id: 'lean-task-4',
          frameworkId: 'lean-six-sigma',
          phaseId: 'lean-phase-4',
          name: 'Implement Solutions',
          ruName: 'Внедрение решений',
          description: 'Implement solutions and improvements',
          ruDescription: 'Внедрение решений и улучшений',
          estimatedHours: 40,
          isRequired: true,
          artifactIds: ['implementation-plan'],
          dependsOn: ['lean-task-3']
        },
        {
          id: 'lean-task-5',
          frameworkId: 'lean-six-sigma',
          phaseId: 'lean-phase-5',
          name: 'Establish Control Measures',
          ruName: 'Установление контрольных мер',
          description: 'Establish control measures for sustained improvement',
          ruDescription: 'Установление контрольных мер для устойчивого улучшения',
          estimatedHours: 15,
          isRequired: true,
          artifactIds: [],
          dependsOn: ['lean-task-4']
        }
      ]
    });
    
    console.log('Задачи фреймворков успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании задач фреймворков:', error);
    throw error;
  }
}

// Запускаем основную функцию
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });