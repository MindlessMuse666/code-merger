package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// MergeHandler обрабатывает объединение файлов
type MergeHandler struct {
	// TODO(добавить): зависимости (сервис для работы с файлами)
}

// MergeRequest представляет запрос на объединение файлов
type MergeRequest struct {
	FileIDs        []string          `json:"file_ids"`
	OutputFilename string            `json:"output_filename"`
	FileRenames    map[string]string `json:"file_renames"`
}

// FileContent представляет содержимое файла с именем
type FileContent struct {
	Filename string
	Content  string
}

// NewMergeHandler создает новый экземпляр MergeHandler
func NewMergeHandler() *MergeHandler {
	return &MergeHandler{}
}

// HandleMerge обрабатывает запрос на объединение файлов
// @Summary Объединение загруженных файлов
// @Description Объединяет ранее загруженные файлы в один текстовый файл с соблюдением правил форматирования
// @Tags Processing
// @Summary Объединение загруженных файлов
// @Description Эндпоинт принимает массив идентификаторов файлов, полученных от /api/upload, и объединяет их содержимое в один файл согласно правилам форматирования. Поддерживает переименование файлов в выходном результате.
// @Accept json
// @Produce octet-stream
// @Param request body MergeRequest true "Параметры объединения"
// @Success 200 {file} binary "Объединенный файл"
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/merge [post]
func (h *MergeHandler) HandleMerge(w http.ResponseWriter, r *http.Request) {
	var request MergeRequest

	// Парсинг JSON тела запроса
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		sendError(w, http.StatusBadRequest, "invalid json", err.Error())
		return
	}

	// Валидация: обязательные поля
	if len(request.FileIDs) == 0 {
		sendError(w, http.StatusBadRequest, "missing required field", "field 'file_ids' is required")
		return
	}
	if request.OutputFilename == "" {
		sendError(w, http.StatusBadRequest, "missing required field", "field 'output_filename' is required")
		return
	}

	// TODO(временная реализация): логика полученияфайлов по их ID
	// Сейчас используем заглушку
	filesContent, err := h.getFilesContent(request.FileIDs, request.FileRenames)
	if err != nil {
		sendError(w, http.StatusNotFound, "files not found", err.Error())
		return
	}

	// Объединяем файлы с правильным форматированием
	result := h.mergeFiles(filesContent)

	// Устанавливаем заголовки для скачивания файла
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", request.OutputFilename))
	w.WriteHeader(http.StatusOK)

	// Отправляем результат
	w.Write([]byte(result))
}

// mergeFiles объединяет файлы с соблюдением правил форматирования
func (h *MergeHandler) mergeFiles(files []FileContent) string {
	var result strings.Builder

	for i, file := range files {
		// Получаем префикс комментария для файла
		prefix := getCommentPrefix(file.Filename)

		// Добавляем заголовок файла
		if strings.Contains(prefix, "<!--") {
			result.WriteString(fmt.Sprintf("%s %s %s\n\n", prefix, file.Filename, "-->"))
		} else if strings.Contains(prefix, "/*") {
			result.WriteString(fmt.Sprintf("%s%s%s\n\n", prefix, file.Filename, "*/"))
		} else {
			result.WriteString(fmt.Sprintf("%s %s\n\n", prefix, file.Filename))
		}

		// Добавляем содержимое файла
		result.WriteString(file.Content)

		// Добавляем разделитель между файлами (кроме последнего)
		if i < len(files)-1 {
			result.WriteString("\n\n\n")
		}
	}

	return result.String()
}

// getFilesContent возвращает содержимое файлов по их ID (заглушка)
// В реальной реализации здесь будет логика получения файлов из хранилища
func (h *MergeHandler) getFilesContent(fileIDs []string, renames map[string]string) ([]FileContent, error) {
	var files []FileContent

	// Заглушка - в реальной реализации здесь будет получение файлов
	for _, id := range fileIDs {
		// Пример: преобразование ID в имя файла для демонстрации
		filename := fmt.Sprintf("file_%s.txt", strings.Split(id, "_")[1])

		// Применяем переименование, если указано
		if newName, exists := renames[filename]; exists {
			filename = newName
		}

		// Заглушка содержимого файла
		content := fmt.Sprintf("содержимое файла %s\nЛиния 1\nЛиния 2", filename)

		files = append(files, FileContent{
			Filename: filename,
			Content:  content,
		})
	}

	return files, nil
}
