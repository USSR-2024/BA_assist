# Инструкция по дальнейшим действиям

## Что было сделано

1. Добавлены задачи для следующих фреймворков:
   - PMBOK-Lite: 13 задач в 4 фазах
   - Scrum-BA Track: 12 задач в 2 фазах
   - Lean/Six Sigma: 16 задач в 5 фазах

2. Исправлен код API для правильного возврата дорожных карт:
   - Изменен формат ответа API `/api/projects/[id]/roadmap`
   - Улучшена обработка данных на фронтенде

3. Сброшены существующие дорожные карты для проекта #10, чтобы можно было создать новые

## Что нужно сделать для проверки

1. Зайдите на страницу проекта #10 и нажмите на вкладку "Дорожная карта"
2. Проект пока не имеет дорожной карты, нажмите на кнопку "Выбрать рекомендуемый фреймворк" или "Создать свою дорожную карту"
3. Выберите фреймворк (например, "Lean / Six Sigma (DMAIC)" или "PMBOK-Lite") и подтвердите создание
4. Должна создаться дорожная карта с фазами и задачами
5. Вернитесь на страницу дорожной карты - теперь вы должны видеть дорожную карту с фазами и задачами

## Решенные проблемы

- Проблема была в том, что у некоторых фреймворков (`FR-PMBLITE`, `FR-SCRUMBA`, `FR-LEAN6`) не было задач, поэтому при создании дорожных карт задачи не создавались
- Также была проблема с форматом ответа API, который не соответствовал ожиданиям фронтенда

## Дополнительные улучшения на будущее

1. Создать недостающие артефакты в каталоге. В текущем решении задачи ссылаются на артефакты, которых нет в каталоге артефактов.
2. Добавить больше информации к задачам (сроки, ответственные, критерии приемки и т.д.)
3. Улучшить визуальное представление дорожной карты (добавить цвета, иконки, фильтры и т.д.)
4. Добавить возможность автоматического создания артефактов при создании дорожной карты