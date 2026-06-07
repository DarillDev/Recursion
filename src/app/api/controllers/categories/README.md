# Categories controller

HTTP-слой для справочника категорий.

**Swagger:** https://zidium3-backend.zidium.net/swagger/index.html?urls.primaryName=Front

## Endpoints

| Метод    | URL                             | Описание                                        |
| -------- | ------------------------------- | ----------------------------------------------- |
| `GET`    | `/front/categories`             | Список категорий (пагинация, поиск, сортировка) |
| `POST`   | `/front/categories`             | Создание категории                              |
| `GET`    | `/front/categories/:id`         | Получение категории по id                       |
| `POST`   | `/front/categories/:id`         | Обновление категории                            |
| `DELETE` | `/front/categories/:id`         | Удаление категории                              |
| `GET`    | `/front/categories/name-exists` | Проверка уникальности названия                  |

## Структура

- `dtos/` — формы данных от сервера (не изменять без сверки со Swagger)
- `interfaces/` — доменные модели
- `services/categories-api/` — сырые HTTP-вызовы
- `services/categories/` — публичное API с маппингом
