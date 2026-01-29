# Story 2.2: Individual Assessment Simulators

Status: completed

## Story

As a **2. aşama BİLSEM adayı**,
I want **bireysel değerlendirme simülatörlerini kullanabilmek**,
so that **gerçek sınav formatına alışabileyim**.

## Acceptance Criteria

1. 30+ kognitif simülatör mevcut olmalı
2. TÜZÖ formatına uygun sorular
3. Zaman sınırlı egzersizler
4. Anlık geri bildirim
5. Performans kaydı ve analizi
6. Zeka türü haritalama (sözel, sayısal, uzamsal, vb.)

## Tasks / Subtasks

- [x] Task 1: Simülatör altyapısı (AC: 1, 2, 3)
  - [x] Subtask 1.1: Base simulator component
  - [x] Subtask 1.2: Timer sistemi
  - [x] Subtask 1.3: Soru havuzu yapısı

- [x] Task 2: Kognitif alan simülatörleri (AC: 1)
  - [x] Subtask 2.1: Sözel Yetenek (8 simülatör)
  - [x] Subtask 2.2: Sayısal Yetenek (6 simülatör)
  - [x] Subtask 2.3: Uzamsal Zeka (7 simülatör)
  - [x] Subtask 2.4: Hafıza & Dikkat (5 simülatör)
  - [x] Subtask 2.5: Mantıksal Akıl Yürütme (4 simülatör)

- [x] Task 3: Performans takibi (AC: 4, 5, 6)
  - [x] Subtask 3.1: Sonuç kaydetme
  - [x] Subtask 3.2: Zeka türü skoru hesaplama
  - [x] Subtask 3.3: İlerleme grafiği

## Dev Notes

### Simülatör Kategorileri

| Kategori | Simülatör Sayısı | Örnek Simülatörler |
|----------|------------------|-------------------|
| Sözel Yetenek | 8 | Kelime Çağrışımı, Anlam Çıkarımı, Benzerlik |
| Sayısal Yetenek | 6 | Sayı Örüntüleri, Mental Aritmetik |
| Uzamsal Zeka | 7 | Şekil Döndürme, Küp Katlama, Labirent |
| Hafıza & Dikkat | 5 | Görsel Hafıza, N-Back, Dikkat Testi |
| Mantıksal Akıl | 4 | Matris Tamamlama, Kural Bulma |

### Base Simulator Interface

```typescript
interface SimulatorConfig {
  id: string;
  name: string;
  category: CognitiveCategory;
  timeLimit: number; // seconds
  questionCount: number;
  difficulty: 'kolay' | 'orta' | 'zor';
}

interface SimulatorResult {
  simulatorId: string;
  userId: string;
  score: number;
  accuracy: number;
  timeSpent: number;
  timestamp: Date;
}
```

### Intelligence Mapping

```typescript
const INTELLIGENCE_TYPES = {
  verbal: ['kelime-cagrisimi', 'anlam-cikarimi', 'benzerlik'],
  numerical: ['sayi-oruntuleri', 'mental-aritmetik'],
  spatial: ['sekil-dondurme', 'kup-katlama', 'labirent'],
  memory: ['gorsel-hafiza', 'n-back'],
  logical: ['matris-tamamlama', 'kural-bulma'],
};
```

### Project Structure Notes

- `src/pages/atolyeler/bireysel-degerlendirme/` - Simülatör sayfaları
- `src/components/simulators/` - Simülatör bileşenleri
- `src/hooks/useSimulatorScore.ts` - Skor hook'u

### References

- [Source: src/pages/atolyeler/bireysel-degerlendirme/]
- [Source: docs/tuzo-alignment.md]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Completion Notes List

- 30+ simülatör implementasyonu tamamlandı
- TÜZÖ uyumlu soru formatları
- Zeka türü haritalama aktif
- Performans dashboard'u mevcut

### File List

| File | Action |
|------|--------|
| `src/pages/atolyeler/bireysel-degerlendirme/*.tsx` | Created |
| `src/components/simulators/*.tsx` | Created |
| `src/hooks/useSimulatorScore.ts` | Created |
| `src/data/quizPool.ts` | Created |
