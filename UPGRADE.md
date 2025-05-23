# Обновление системы BA Assist

## Обновление с добавлением каталога артефактов (май 2025)

### 1. Применение миграции базы данных

Необходимо выполнить SQL-запросы из файла миграции:
```
/prisma/migrations/20250508_add_artifacts_catalog/migration.sql
```

### 2. Обновление кодовой базы

Обновленные и добавленные файлы:
- `/lib/artifact-classifier.ts` - классификатор артефактов
- `/app/api/artifacts/catalog/route.ts` - API для работы с каталогом артефактов
- `/app/api/projects/[id]/artifacts/route.ts` - API для артефактов проекта
- `/app/api/projects/[projectId]/artifacts/[artifactId]/route.ts` - API для конкретного артефакта проекта
- `/app/api/upload/route.ts` - обновленный обработчик загрузки файлов

### 3. Импорт каталога артефактов

После применения миграции необходимо импортировать каталог артефактов, используя скрипт:
```
scripts/import-artifacts-catalog.js
```

Если возникают проблемы с Prisma, можно воспользоваться SQL-запросами для прямого импорта данных из JSON-файла.

### 4. Тестирование

После обновления следует проверить:
1. Загрузку файлов и их автоматическую классификацию
2. Отображение артефактов в интерфейсе проекта
3. Работу API для управления артефактами

## Требования к системе

- Node.js 16+ 
- PostgreSQL 13+
- Google Cloud Storage (для хранения файлов)