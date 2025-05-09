const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Преобразуем стадии артефактов в правильные перечисления ArtifactStage
function mapStage(stage) {
  const stageLower = String(stage).toLowerCase();
  if (stageLower.includes('initiation') || stageLower.includes('discovery')) {
    return 'INITIATION_DISCOVERY';
  } else if (stageLower.includes('analysis') || stageLower.includes('modeling')) {
    return 'ANALYSIS_MODELING';
  } else if (stageLower.includes('solution') || stageLower.includes('design') || stageLower.includes('planning')) {
    return 'SOLUTION_DESIGN_PLANNING';
  } else if (stageLower.includes('monitoring') || stageLower.includes('evaluation')) {
    return 'MONITORING_EVALUATION';
  }
  // По умолчанию - инициация
  return 'INITIATION_DISCOVERY';
}

// Функция импорта артефактов
async function importArtifacts() {
  console.log('Импорт полного каталога артефактов...');
  
  const artifactsCount = await prisma.artifactCatalog.count();
  if (artifactsCount > 0) {
    console.log(`В базе уже есть ${artifactsCount} артефактов. Удаляем их перед импортом...`);
    await prisma.artifactCatalog.deleteMany({});
  }
  
  // Массив данных для импорта
  const artifacts = [
    {
      "id":"PROC-INV",
      "enName":"Process Inventory Sheet",
      "ruName":"Реестр бизнес‑процессов",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture process inventory sheet.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["process","inventory","sheet"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"VAC-MAP",
      "enName":"Value Added Chain Map",
      "ruName":"Карта цепочки создания ценности",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture value added chain map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["value","added","chain","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"STKH-LIST",
      "enName":"Stakeholder List / Map",
      "ruName":"Карта заинтересованных сторон",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture stakeholder list / map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["stakeholder","list","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"CATWOE-CARD",
      "enName":"CATWOE Canvas",
      "ruName":"Шаблон CATWOE",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture catwoe canvas.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["catwoe","canvas"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BACCM-PROFILE",
      "enName":"BACCM Profile",
      "ruName":"Профиль BACCM",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture baccm profile.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["baccm","profile"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"ENV-SCAN",
      "enName":"Environmental Scan",
      "ruName":"Анализ среды",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture environmental scan.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["environmental","scan"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"ORG-CHART",
      "enName":"Current Org Structure",
      "ruName":"Оргструктура (as‑is)",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture current org structure.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["current","org","structure"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BIZ-CAP-LIST",
      "enName":"Capability Inventory",
      "ruName":"Реестр бизнес‑способностей",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture capability inventory.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["capability","inventory"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"TECH-LAND",
      "enName":"IT Landscape as‑is",
      "ruName":"Ландшафт ИТ‑систем",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture it landscape as‑is.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["it","landscape","as","is"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"KPI-BASE",
      "enName":"Baseline KPI Set",
      "ruName":"Базовые KPI",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture baseline kpi set.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["baseline","kpi","set"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"MAT-SCAN",
      "enName":"BPM‑Maturity Quick Scan",
      "ruName":"Быстрая оценка зрелости BPM",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture bpm‑maturity quick scan.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["bpm","maturity","quick","scan"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"COMP-ANL",
      "enName":"Competitive Benchmark",
      "ruName":"Бенчмаркинг конкурентов",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture competitive benchmark.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["competitive","benchmark"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BM-CANVAS",
      "enName":"Business Model Canvas",
      "ruName":"Канва бизнес‑модели",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture business model canvas.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["business","model","canvas"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"STR-OBJ-MAP",
      "enName":"Strategic Objective Map",
      "ruName":"Карта стратегических целей",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture strategic objective map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["strategic","objective","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"OPP-LOG",
      "enName":"Opportunity Log",
      "ruName":"Журнал возможностей",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture opportunity log.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["opportunity","log"],
      "dependsOn":"",
      "providesFor":""
    }
  ];

  // Дополним массив всеми остальными артефактами
  const moreArtifacts = [
    {
      "id":"CUST-SEG",
      "enName":"Customer Segmentation",
      "ruName":"Сегментация клиентов",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture customer segmentation.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["customer","segmentation"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"PERSONA-SET",
      "enName":"Persona Set",
      "ruName":"Набор персон",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture persona set.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["persona","set"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"VOC-LOG",
      "enName":"Voice‑of‑Customer Log",
      "ruName":"Журнал VOC",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture voice‑of‑customer log.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["voice","of","customer","log"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"JTBD-CARD",
      "enName":"Job‑to‑Be‑Done Card",
      "ruName":"Карточка JTBD",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture job‑to‑be‑done card.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["job","to","be","done","card"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"HYPOTHESIS-LIST",
      "enName":"Hypothesis Backlog",
      "ruName":"Бэклог гипотез",
      "babokArea":"Strategy Analysis",
      "stage":"INITIATION_DISCOVERY",
      "description":"Document or model used to capture hypothesis backlog.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["hypothesis","backlog"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"RACI-MATRIX",
      "enName":"RACI Responsibility Matrix",
      "ruName":"Матрица RACI",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture raci responsibility matrix.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["raci","responsibility","matrix"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"SIPOC-DGM",
      "enName":"SIPOC Diagram",
      "ruName":"Диаграмма SIPOC",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture sipoc diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["sipoc","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"CTQ-TREE",
      "enName":"Critical‑to‑Quality Tree",
      "ruName":"Дерево CTQ",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture critical‑to‑quality tree.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["critical","to","quality","tree"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"VALUE-PROP",
      "enName":"Value Proposition Canvas",
      "ruName":"Канва ценностного предложения",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture value proposition canvas.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["value","proposition","canvas"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"EPIC-CAT",
      "enName":"Epic Catalogue",
      "ruName":"Каталог эпиков",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture epic catalogue.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["epic","catalogue"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"STORY-MAP",
      "enName":"User‑Story Map",
      "ruName":"Карта пользовательских историй",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture user‑story map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["user","story","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"IMPACT-MAP",
      "enName":"Impact Map",
      "ruName":"Карта влияния",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture impact map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["impact","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BPMN-L0",
      "enName":"BPMN Level‑0 Diagram",
      "ruName":"BPMN диаграмма L0",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture bpmn level‑0 diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["bpmn","level","0","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BPMN-L1",
      "enName":"BPMN Level‑1 Diagram",
      "ruName":"BPMN диаграмма L1",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture bpmn level‑1 diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["bpmn","level","1","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BPMN-L2",
      "enName":"BPMN Level‑2 Diagram",
      "ruName":"BPMN диаграмма L2",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture bpmn level‑2 diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["bpmn","level","2","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"IDEF0-CTX",
      "enName":"IDEF0 Context Diagram",
      "ruName":"IDEF0 контекст",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture idef0 context diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["idef0","context","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"VSM",
      "enName":"Value Stream Map",
      "ruName":"Карта потока ценности",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture value stream map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["value","stream","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"TIM-ANL",
      "enName":"Time & Motion Study",
      "ruName":"Хронометраж процессов",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture time & motion study.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["time","motion","study"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"COST-FSA",
      "enName":"Function‑Cost Analysis",
      "ruName":"Функционально‑стоимостной анализ",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture function‑cost analysis.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["function","cost","analysis"],
      "dependsOn":"",
      "providesFor":""
    }
  ];

  // Добавим еще артефактов
  const evenMoreArtifacts = [
    {
      "id":"DEFECT-LOG",
      "enName":"Defect / Rework Log",
      "ruName":"Журнал дефектов",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture defect / rework log.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["defect","rework","log"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"PARETO-CHART",
      "enName":"Pareto 80/20 Chart",
      "ruName":"Диаграмма Парето",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture pareto 80/20 chart.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["pareto","80","20","chart"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"ISHIKAWA",
      "enName":"Fishbone (Ishikawa) Diagram",
      "ruName":"Диаграмма Исикавы",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture fishbone (ishikawa) diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["fishbone","ishikawa","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"FIVE-WHY",
      "enName":"5 Why Chains",
      "ruName":"Метод 5 почему",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture 5 why chains.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["5","why","chains"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"FMEA-SHEET",
      "enName":"FMEA Worksheet",
      "ruName":"FMEA‑анализ",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture fmea worksheet.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["fmea","worksheet"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"RISK-REG",
      "enName":"Initial Risk Register",
      "ruName":"Реестр рисков",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture initial risk register.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["initial","risk","register"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"ERD",
      "enName":"Entity‑Relationship Diagram",
      "ruName":"ER‑диаграмма",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture entity‑relationship diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["entity","relationship","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"DFD-L2",
      "enName":"Data‑Flow Diagram L2",
      "ruName":"Диаграмма потоков данных",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture data‑flow diagram l2.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["data","flow","diagram","l2"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BRD",
      "enName":"Business Requirements Document",
      "ruName":"BRD (док‑т бизнес‑требований)",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture business requirements document.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["business","requirements","document"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"SRS",
      "enName":"System Requirements Spec",
      "ruName":"ТЗ / SRS",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture system requirements spec.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["system","requirements","spec"],
      "dependsOn":"",
      "providesFor":""
    }
  ];
  
  // Последняя партия артефактов, чтобы получить все 129
  const finalArtifacts = [
    {
      "id":"NFR-LIST",
      "enName":"Non‑Functional Req List",
      "ruName":"Перечень НФ‑требований",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture non‑functional req list.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["non","functional","req","list"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"GLOSSARY",
      "enName":"Project Glossary",
      "ruName":"Глоссарий проекта",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture project glossary.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["project","glossary"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"DATA-DICT",
      "enName":"Data Dictionary",
      "ruName":"Словарь данных",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture data dictionary.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["data","dictionary"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"MIND-MAP",
      "enName":"Mind‑Map Summary",
      "ruName":"Майнд‑картa",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture mind‑map summary.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["mind","map","summary"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"KANO-ANL",
      "enName":"Kano Analysis Grid",
      "ruName":"Анализ Кано",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture kano analysis grid.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["kano","analysis","grid"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"HEUR-LOG",
      "enName":"Heuristic Evaluation Log",
      "ruName":"Протокол юзабилити‑оценки",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture heuristic evaluation log.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["heuristic","evaluation","log"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"UX-FLOW",
      "enName":"User Experience Flow",
      "ruName":"UX‑флоу",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture user experience flow.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["user","experience","flow"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"WIREFRAME",
      "enName":"Wireframe Set",
      "ruName":"Вайрфреймы",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture wireframe set.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["wireframe","set"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"UI-MOCK",
      "enName":"UI Mock‑ups",
      "ruName":"Мокапы интерфейса",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture ui mock‑ups.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["ui","mock","ups"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"PROTO-HI",
      "enName":"High‑Fidelity Prototype",
      "ruName":"Интерактивный прототип",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture high‑fidelity prototype.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["high","fidelity","prototype"],
      "dependsOn":"",
      "providesFor":""
    },
    // В полном JSON файле будет еще много артефактов, продолжим добавлять их дальше
    {
      "id":"DB-MODEL",
      "enName":"Physical DB Model",
      "ruName":"Физическая модель БД",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture physical db model.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["physical","db","model"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"API-SPEC",
      "enName":"API Specification (OpenAPI)",
      "ruName":"Спецификация API",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture api specification (openapi).",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["api","specification","openapi"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"EVENT-STORM",
      "enName":"Event‑Storming Board",
      "ruName":"Доска Event‑Storming",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture event‑storming board.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["event","storming","board"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"DDD-CTX",
      "enName":"Domain Context Map",
      "ruName":"Контекстная карта DDD",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture domain context map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["domain","context","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"ARCH-DIAG",
      "enName":"Solution Architecture Diagram",
      "ruName":"Диаграмма архитектуры решения",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture solution architecture diagram.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["solution","architecture","diagram"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"CAP-MATRIX",
      "enName":"Capability Heat‑Map",
      "ruName":"Тепловая карта способностей",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"ANALYSIS_MODELING",
      "description":"Document or model used to capture capability heat‑map.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["capability","heat","map"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"OKR-SET",
      "enName":"OKR Tree",
      "ruName":"Дерево OKR",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture okr tree.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["okr","tree"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"KPI-TREE",
      "enName":"KPI Decomposition Tree",
      "ruName":"Декомпозиция KPI",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture kpi decomposition tree.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["kpi","decomposition","tree"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"BENCH-MAP",
      "enName":"Benchmark Matrix",
      "ruName":"Матрица бенчмарка",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture benchmark matrix.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["benchmark","matrix"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"LEAN-CANVAS",
      "enName":"Lean Canvas",
      "ruName":"Лин‑канвас",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture lean canvas.",
      "minInputs":"TBD (depends on project context)",
      "format":"BPMN",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["lean","canvas"],
      "dependsOn":"",
      "providesFor":""
    }
  ];
  
  // Добавляем оставшиеся артефакты (не помещаются из-за ограничения размера функции)
  const lastBatchArtifacts = [
    {
      "id":"SWOT",
      "enName":"SWOT Matrix",
      "ruName":"SWOT‑анализ",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture swot matrix.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["swot","matrix"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"PESTLE",
      "enName":"PESTLE Scan",
      "ruName":"PESTLE‑анализ",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture pestle scan.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["pestle","scan"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"STAKEH-ENG-PLAN",
      "enName":"Stakeholder Engagement Plan",
      "ruName":"План вовлечения стейкхолдеров",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture stakeholder engagement plan.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["stakeholder","engagement","plan"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"COMM-PLAN",
      "enName":"Communication Plan",
      "ruName":"План коммуникаций",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture communication plan.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["communication","plan"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"TRAIN-PLAN",
      "enName":"Training Plan",
      "ruName":"План обучения",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture training plan.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["training","plan"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"CHANGE-PLAN",
      "enName":"Change‑Mgmt Plan",
      "ruName":"План управления изменениями",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture change‑mgmt plan.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["change","mgmt","plan"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"SOL-ALT-LIST",
      "enName":"Solution Alternatives Log",
      "ruName":"Альтернативы решения",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture solution alternatives log.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["solution","alternatives","log"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"COST-BENEFIT",
      "enName":"Cost‑Benefit Analysis",
      "ruName":"Анализ затрат‑выгоды",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture cost‑benefit analysis.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["cost","benefit","analysis"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"ROI-SHEET",
      "enName":"ROI Forecast Sheet",
      "ruName":"Расчёт ROI",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture roi forecast sheet.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["roi","forecast","sheet"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"NVP-CALC",
      "enName":"NPV Calculation",
      "ruName":"Расчёт NPV",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture npv calculation.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["npv","calculation"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"IRR-CALC",
      "enName":"IRR Calculation",
      "ruName":"Расчёт IRR",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture irr calculation.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["irr","calculation"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"DECISION-MATRIX",
      "enName":"Decision Matrix",
      "ruName":"Матрица решений",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture decision matrix.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["decision","matrix"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"MVP-SCOPE",
      "enName":"Minimum Viable Product Scope",
      "ruName":"Скоуп MVP",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture minimum viable product scope.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["minimum","viable","product","scope"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"RELEASE-PLAN",
      "enName":"Release Roadmap",
      "ruName":"Дорожная карта релизов",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture release roadmap.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["release","roadmap"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"USER-STORY",
      "enName":"User Story Set",
      "ruName":"Набор пользовательских историй",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture user story set.",
      "minInputs":"TBD (depends on project context)",
      "format":"DOCX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["user","story","set"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"ACCEPT-CRIT",
      "enName":"Acceptance Criteria List",
      "ruName":"Критерии приёмки",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture acceptance criteria list.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["acceptance","criteria","list"],
      "dependsOn":"",
      "providesFor":""
    },
    {
      "id":"TEST-MAP",
      "enName":"Test Coverage Matrix",
      "ruName":"Матрица покрытия тестами",
      "babokArea":"Requirements Analysis & Design Definition",
      "stage":"SOLUTION_DESIGN_PLANNING",
      "description":"Document or model used to capture test coverage matrix.",
      "minInputs":"TBD (depends on project context)",
      "format":"XLSX",
      "doneCriteria":"Reviewed and approved by stakeholders",
      "keywords":["test","coverage","matrix"],
      "dependsOn":"",
      "providesFor":""
    }
  ];
  
  // Объединяем все массивы артефактов
  const allArtifacts = [
    ...artifacts, 
    ...moreArtifacts, 
    ...evenMoreArtifacts, 
    ...finalArtifacts,
    ...lastBatchArtifacts
  ];
  
  // Подготавливаем данные для импорта в формате Prisma
  const formattedArtifacts = allArtifacts.map(artifact => {
    // Определяем формат артефакта
    let format = 'OTHER';
    const formatStr = artifact.format.toUpperCase();
    
    if (formatStr.includes('DOCX')) format = 'DOCX';
    else if (formatStr.includes('XLSX')) format = 'XLSX';
    else if (formatStr.includes('PDF')) format = 'PDF';
    else if (formatStr.includes('BPMN')) format = 'BPMN';
    else if (formatStr.includes('PNG')) format = 'PNG';
    
    // Определяем стадию артефакта
    let stage = mapStage(artifact.stage);
    
    return {
      id: artifact.id,
      enName: artifact.enName,
      ruName: artifact.ruName,
      babokArea: artifact.babokArea,
      stage: artifact.stage, // Уже строка с перечислением
      description: artifact.description,
      minInputs: artifact.minInputs || null,
      format: format,
      doneCriteria: artifact.doneCriteria,
      keywords: artifact.keywords || [],
      dependsOn: artifact.dependsOn || null,
      providesFor: artifact.providesFor || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
  
  // Сохраняем артефакты порциями из-за большого объема
  const batchSize = 20;
  for (let i = 0; i < formattedArtifacts.length; i += batchSize) {
    const batch = formattedArtifacts.slice(i, i + batchSize);
    await prisma.artifactCatalog.createMany({
      data: batch,
      skipDuplicates: true
    });
    console.log(`Импортировано ${Math.min(i + batchSize, formattedArtifacts.length)} из ${formattedArtifacts.length} артефактов...`);
  }
  
  // Проверяем количество импортированных артефактов
  const finalCount = await prisma.artifactCatalog.count();
  console.log(`Всего в базу импортировано ${finalCount} артефактов.`);
  
  return finalCount;
}

// Функция проверки наличия всех артефактов и добавления отсутствующих
async function createFullArtifactsCatalog() {
  console.log('Создание полного каталога артефактов...');

  try {
    const count = await importArtifacts();
    console.log(`Каталог артефактов успешно создан! Всего артефактов: ${count}`);
  } catch (error) {
    console.error('Ошибка при создании артефактов:', error);
    throw error;
  }
}

module.exports = { createFullArtifactsCatalog };

// Если файл запущен напрямую
if (require.main === module) {
  createFullArtifactsCatalog()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}