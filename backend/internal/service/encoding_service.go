// Package service предоставляет сервисный слой для бизнес-логики приложения.
// Содержит методы для для обработки кодировок файлов.
package service

import (
	"bytes"
	"fmt"
	"io"
	"unicode/utf8"

	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/encoding/unicode"
	"golang.org/x/text/transform"
)

// EncodingService предоставляет методы для работы с кодировками файлов
type EncodingService struct{}

// NewEncodingService создает новый экземпляр EncodingService
func NewEncodingService() *EncodingService {
	return &EncodingService{}
}

// ConvertToUTF8 конвертирует содержимое файла в UTF-8
func (s *EncodingService) ConvertToUTF8(content []byte) (string, error) {
	// Валидаци: не UTF-8 ли уже
	if utf8.Valid(content) {
		return string(content), nil
	}

	// Тестирование распространеннх кодировок
	encodings := []struct {
		name    string
		decoder transform.Transformer
	}{
		{"UTF-16LE", unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM).NewDecoder()},
		{"UTF-16BE", unicode.UTF16(unicode.BigEndian, unicode.IgnoreBOM).NewDecoder()},
		{"Windows-1251", charmap.Windows1251.NewDecoder()},
		{"Windows-1252", charmap.Windows1252.NewDecoder()},
		{"ISO-8859-1", charmap.ISO8859_1.NewDecoder()},
		{"ISO-8859-5", charmap.ISO8859_5.NewDecoder()},
		{"KOI8-R", charmap.KOI8R.NewDecoder()},
	}

	for _, encoding := range encodings {
		decoded, err := s.tryDecode(content, encoding.decoder)
		if err == nil && utf8.Valid(decoded) {
			return string(decoded), nil
		}
	}

	return "", fmt.Errorf("unable to convert content to UTF-8: unrecognized encoding")
}

// tryDecode пытается декодировать контент
func (s *EncodingService) tryDecode(content []byte, decoder transform.Transformer) ([]byte, error) {
	reader := transform.NewReader(bytes.NewReader(content), decoder)
	decoded, err := io.ReadAll(reader)
	if err != nil {
		return nil, err
	}
	return decoded, nil
}

// DetectEncoding пытается определить кодировку содержимого
func (s *EncodingService) DetectEncoding(content []byte) string {
	if utf8.Valid(content) {
		return "UTF-8"
	}

	// Простая эвристика для определения распространенных кодировок
	if s.looksLikeWindows1251(content) {
		return "Windows-1251"
	}

	return "unknown"
}

// looksLikeWindows1251 проверяет, похоже ли содержимое на Windows-1251
func (s *EncodingService) looksLikeWindows1251(content []byte) bool {
	// Эвристика: проверяем наличие кириллических символов в типичном для Windows-1251 диапазоне
	for _, b := range content {
		if b >= 0xC0 && b <= 0xFF {
			return true
		}
	}
	return false
}
