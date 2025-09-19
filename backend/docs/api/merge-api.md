# Объединить файлы (POST)

## Общее описание

Объединение ранее загруженных файлов в один текстовый файл с соблюдением правил форматирования.

**Метод:** POST  
**URL:** `/api/merge`

## Логика работы

1. Валидация JSON тела запроса
2. Проверка существования указанных `file_ids`
3. Применение переименований файлов (если указаны)
4. Объединение файлов согласно правилам форматирования
5. Генерация выходного файла с указанным именем
6. Отправка результата в виде файла для скачивания

## Запрос

**Тело запроса (JSON):**

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| **file_ids** | string[] | Да | Массив идентификаторов файлов, полученных от `/api/upload` |
| **output_filename** | string | Да | Имя результирующего файла (например, `code-base.txt`) |
| **file_renames** | object | Нет | Объект для переименования файлов в формате `{"оригинальное_имя": "новое_имя"}` |

**Пример тела запроса:**

```json
{
  "file_ids": ["file_123456789", "file_987654321"],
  "output_filename": "project.txt",
  "file_renames": {
    "main_old.go": "main.go",
    "config.yaml": "settings.yaml"
  }
}
```

**Заголовки**:

| Заголовок | Обязательный | Значение |
|---|---|---|
| **Content-Type** | Да | application/json |

**Ответ**:

**Успешный ответ (200 OK)**:

Возвращает бинарный поток с объединенным файлом.

**Заголовки ответа**:

| Заголовок | Значение |
| --------- | -------- |
| **Content-Type** | application/octet-stream |
| **Content-Disposition** | attachment; filename="[output_filename]" |

**Возможные ошибки**:

`400 Bad Request` - Невалидный запрос

```json
{
  "error": "Invalid request body",
  "details": "Missing required field 'file_ids'"
}
```

`404 Not Found` - Файлы не найдены

```json
{
  "error": "Files not found",
  "details": "Some file IDs could not be found: file_999999999"
}
```

`415 Unsupported Media Type` - Неподдерживаемый формат запроса

```json
{
  "error": "Unsupported media type",
  "details": "Expected application/json"
}
```

`500 Internal Server Error` - Ошибка обработки файлов

```json
{
  "error": "Failed to process files",
  "details": "Error reading file content"
}
```

## Правила форматирования

Каждый файл в результате форматируется следующим образом:

1. Заголовок в комментариях соответствующего языка
2. Пустая строка после заголовка
3. Содержимое файла без изменений
4. Разделение между файлами - три пустые строки

**Пример результата**:

```txt
// main.go

package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}



# config.yaml
name: code-merger
server:
  port: 8080
  host: localhost
```

## Поддерживаемые форматы файлов

| Расширение | Символ комментария | Пример заголовка |
| ---------- | ------------------ | ---------------- |
| `.md` | `<!--  -->` | `<!-- api-spec.md -->` |
| `.txt` | `#` | `# notes.txt` |
| `.yaml` | `#` | `# config.yaml` |
| `.yml` | `#` | `# docker-compose.yml` |
| `.sh` | `#` | `# install-tailwind.sh` |
| `Dockerfile` | `#` | `# Dockerfile` |
| `Makefile` | `#` | `# Makefile` |
| `.json` | `//` | `// settings.json` |
| `.cpp` | `//` | `// main.cpp` |
| `.go` | `//` | `// main.go` |
| `.py` | `#` | `# main.py` |
| `.html` | `<!--  -->` | `<!-- index.html -->` |
| `.css` | `/*  */` | `/*styles.css*/` |
| `.js` | `//` | `// app.js` |
