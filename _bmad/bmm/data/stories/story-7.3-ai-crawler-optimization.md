# Story 7.3: SEO & AI Crawler Optimization

Status: completed

## Story

As a **platform**,
I want **AI sistemleri tarafından indekslenebilmek**,
so that **ChatGPT, Claude, Perplexity gibi sistemlerde görünebilleyim**.

## Acceptance Criteria

1. `robots.txt` tüm major AI crawler'lara izin vermeli
2. `llms.txt` dosyası platform bilgilerini sunmalı
3. `sitemap.xml` tüm URL'leri içermeli
4. Admin ve API yolları AI crawler'lardan gizlenmeli

## Tasks / Subtasks

- [x] Task 1: robots.txt güncelle (AC: 1, 4)
  - [x] Subtask 1.1: Mevcut robots.txt analiz et
  - [x] Subtask 1.2: AI crawler user-agent'ları ekle
  - [x] Subtask 1.3: Admin/API yollarını Disallow yap

- [x] Task 2: llms.txt oluştur (AC: 2)
  - [x] Subtask 2.1: Platform özeti yaz
  - [x] Subtask 2.2: Özellik listesi ekle
  - [x] Subtask 2.3: Önemli URL'leri listele

- [x] Task 3: Sitemap doğrula (AC: 3)
  - [x] Subtask 3.1: URL sayısını kontrol et (461 URL)
  - [x] Subtask 3.2: Sitemap'i yeniden oluştur

## Dev Notes

### AI Crawler User-Agents

```
GPTBot          - OpenAI
ChatGPT-User    - OpenAI
Claude-Web      - Anthropic
anthropic-ai   - Anthropic
Google-Extended - Google AI
PerplexityBot   - Perplexity
cohere-ai       - Cohere
Meta-ExternalAgent - Meta
Applebot        - Apple
CCBot           - Common Crawl
```

### llms.txt Format

LLM'ler için optimize edilmiş markdown formatında:
- Platform açıklaması
- Temel özellikler
- Hedef kitle
- İçerik kategorileri
- Önemli URL'ler

### Project Structure Notes

- `public/robots.txt` - Crawler izinleri
- `public/llms.txt` - AI context dosyası
- `public/sitemap.xml` - SEO sitemap

### References

- [Source: public/robots.txt]
- [Source: public/llms.txt]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

- Conversation: 55548082-59a8-4f1c-8c00-d358346f7f59
- Date: 2026-01-29

### Completion Notes List

- AI crawler optimizasyonu commit: `feat(seo): AI crawler optimizasyonu - llms.txt ve robots.txt güncelleme`

### File List

| File | Action |
|------|--------|
| `public/robots.txt` | Modified |
| `public/llms.txt` | Created |
