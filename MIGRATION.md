# Инструкция по миграции базы данных

В этом документе описаны шаги по миграции базы данных приложения BA Assist с нуля, включая создание схемы и заполнение начальными данными.

## Предварительные шаги

1. Убедитесь, что переменная окружения `DATABASE_URL` в файле `.env` установлена правильно:

```
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"
```

2. Сделайте резервную копию базы данных, если в ней уже есть данные (рекомендуется!):

```bash
# Для PostgreSQL
pg_dump -U username -d database_name > backup_before_migration.sql
```

## Шаг 1: Полный сброс базы данных (при необходимости)

Если вы хотите полностью сбросить базу данных и начать с нуля:

```bash
# Для PostgreSQL - подключитесь и удалите все таблицы
psql -U username -d database_name -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Или использовать инструмент Prisma для сброса (не всегда работает корректно)
# npx prisma migrate reset --force
```

## Шаг 2: Подготовка файлов

1. Скопируйте новый файл схемы Prisma:

```bash
cp schema.prisma.new prisma/schema.prisma
```

2. Создайте папку для новой миграции:

```bash
mkdir -p prisma/migrations/$(date +"%Y%m%d%H%M%S")_full_migration
cp prisma/migrations/clean_migration/migration.sql prisma/migrations/$(date +"%Y%m%d%H%M%S")_full_migration/
```

3. Обновите файл seed.ts:

```bash
cp prisma/seed.ts.new prisma/seed.ts
```

## Шаг 3: Применение миграции

Выполните следующую команду для прямого применения SQL-миграции к базе данных:

```bash
# Используя psql (рекомендуется)
psql -U username -d database_name -f prisma/migrations/clean_migration/migration.sql

# Или использовать подход Prisma
npx prisma migrate resolve --applied $(date +"%Y%m%d%H%M%S")_full_migration
npx prisma db push
```

## Шаг 4: Генерация клиента Prisma

После применения миграции обновите Prisma Client:

```bash
npx prisma generate
```

## Шаг 5: Заполнение базы данных начальными данными

```bash
npx prisma db seed
```

## Шаг 6: Проверка

Проверьте, что база данных содержит ожидаемые таблицы и данные:

```bash
# Запустите Prisma Studio для визуального просмотра базы данных
npx prisma studio

# Или используйте SQL-запросы
psql -U username -d database_name -c "SELECT COUNT(*) FROM \"Framework\""
psql -U username -d database_name -c "SELECT COUNT(*) FROM \"BusinessProcess\""
```

## Решение проблем

### 1. Проблема: Таблица уже существует

Если вы получаете ошибку вида `relation "X" already exists`, возможно часть таблиц уже создана в базе данных. Попробуйте:

```bash
# Удалить конкретную таблицу
psql -U username -d database_name -c "DROP TABLE IF EXISTS \"X\" CASCADE;"
```

### 2. Проблема: Prisma не видит изменения

Если Prisma не видит изменения в схеме:

```bash
# Принудительное обновление базы данных
npx prisma db push --force-reset
```

### 3. Проблема: Ошибки в _prisma_migrations

Если возникают проблемы с таблицей миграций:

```bash
# Сбросить таблицу миграций
psql -U username -d database_name -c "DROP TABLE IF EXISTS \"_prisma_migrations\" CASCADE;"
```

## Дополнительные команды

### Обновление существующих данных

Если вы обновляете существующую базу данных и хотите добавить новые значения в enum ProjectStatus:

```sql
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'DELETED';
```