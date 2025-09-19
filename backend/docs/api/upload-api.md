# Загрузить файлы (POST)

## Общее описание

Загрузка одного или нескольких файлов для последующего объединения.

**Метод:** POST  
**URL:** `/api/upload`

## Логика работы

1. Проверка размера запроса
2. Парсинг multipart/form-data
3. Валидация расширений файлов
4. Проверка размеров файлов
5. Обработка и сохранение файлов
6. Возврат идентификаторов файлов

## Запрос

**Тело запроса (multipart/form-data):**

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| **files** | file[] | Да | Массив файлов для загрузки |

**Заголовки:**

| Заголовок | Обязательный | Значение |
|---|---|---|
| **Content-Type** | Да | multipart/form-data |

## Ответ

**Успешный ответ (200 OK)**:

```json
{
  "message": "files uploaded successfully",
  "file_ids": ["file_123456789", "file_987654321"]
}
```

**Возможные ошибки**:

`400 Bad Request` - Невалидный запрос

```json
{
  "error": "no files provided",
  "details": "please provide at least one file"
}
```

`413 Payload Too Large` - Превышен лимит размера

```json
{
  "error": "file too large",
  "details": "file 'example.txt' exceeds maximum size limit"
}
```

`415 Unsupported Media Type` - Неподдерживаемый формат

```json
{
  "error": "unsupported file type", 
  "details": "file 'example.exe' has unsupported extension"
}
```
