# Story 3.3: Art Workshop - AI Drawing Analysis

Status: completed

## Story

As a **resim yeteneği adayı**,
I want **çizimlerimi AI ile analiz ettirebilmek**,
so that **resim yeteneklerimi değerlendirebilleyim**.

## Acceptance Criteria

1. Fotoğraf çekme veya dosya yükleme desteği
2. AI analizi yapılmalı (OpenAI Vision / Gemini)
3. Kompozisyon puanı verilmeli
4. Teknik yeterlilik değerlendirmesi
5. Yaratıcılık skoru
6. Detaylı geri bildirim metni
7. Analiz kotası takibi (günlük/aylık limit)

## Tasks / Subtasks

- [x] Task 1: Görsel yakalama (AC: 1)
  - [x] Subtask 1.1: Kamera erişimi (mobile)
  - [x] Subtask 1.2: Dosya yükleme
  - [x] Subtask 1.3: Görsel önizleme

- [x] Task 2: AI analiz entegrasyonu (AC: 2, 3, 4, 5, 6)
  - [x] Subtask 2.1: Supabase Edge Function oluştur
  - [x] Subtask 2.2: OpenAI/Gemini Vision API çağrısı
  - [x] Subtask 2.3: Prompt engineering (pedagojik değerlendirme)
  - [x] Subtask 2.4: Response parsing ve skor hesaplama

- [x] Task 3: Kota yönetimi (AC: 7)
  - [x] Subtask 3.1: Kullanım sayacı
  - [x] Subtask 3.2: Limit kontrolü
  - [x] Subtask 3.3: Premium bypass

## Dev Notes

### AI Analysis Prompt

```
Sen bir sanat eğitimcisisin. Bu çocuk çizimini BİLSEM resim yetenek 
değerlendirmesi kriterlerine göre analiz et:

1. Kompozisyon (1-10): Öğelerin yerleşimi, denge, oran
2. Teknik (1-10): Çizgi kalitesi, gölgeleme, detay
3. Yaratıcılık (1-10): Özgünlük, hayal gücü, anlatım

Her kategori için kısa açıklama ve genel değerlendirme yap.
Çocuğa yönelik pozitif ve teşvik edici dil kullan.
```

### Response Schema

```typescript
interface ArtAnalysisResult {
  composition: { score: number; feedback: string };
  technique: { score: number; feedback: string };
  creativity: { score: number; feedback: string };
  overallScore: number;
  generalFeedback: string;
  suggestions: string[];
}
```

### Quota System

| Plan | Günlük Limit | Aylık Limit |
|------|--------------|-------------|
| Ücretsiz | 2 | 10 |
| Temel | 5 | 50 |
| Premium | Sınırsız | Sınırsız |

### Project Structure Notes

- `src/pages/atolyeler/resim/AIAnalysis.tsx` - Analiz sayfası
- `supabase/functions/analyze-drawing/` - Edge function
- `src/hooks/useAnalysisQuota.ts` - Kota hook'u

### References

- [Source: src/pages/atolyeler/resim/]
- [Source: supabase/functions/analyze-drawing/]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Completion Notes List

- Dual-track analiz (OpenAI + Gemini fallback)
- Kara kalem prompt optimizasyonu
- Kota sistemi aktif
- Analiz geçmişi kayıt

### File List

| File | Action |
|------|--------|
| `src/pages/atolyeler/resim/AIAnalysis.tsx` | Created |
| `supabase/functions/analyze-drawing/index.ts` | Created |
| `src/hooks/useAnalysisQuota.ts` | Created |
