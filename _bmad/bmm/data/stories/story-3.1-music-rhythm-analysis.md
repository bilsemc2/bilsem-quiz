# Story 3.1: Music Workshop - Rhythm Analysis

Status: completed

## Story

As a **müzik yeteneği adayı**,
I want **ritim algılama testleri yapabilmek**,
so that **ritim yeteneğimi ölçebilleyim**.

## Acceptance Criteria

1. Sesli ritim pattern'leri çalınabilmeli
2. Kullanıcı ritmi takip edebilmeli (tap/click)
3. Tepki süresi milisaniye hassasiyetle ölçülmeli
4. Doğruluk oranı hesaplanmalı
5. Zorluk seviyeleri olmalı (kolay, orta, zor)
6. Sonuçlar zeka haritasına kaydedilmeli

## Tasks / Subtasks

- [x] Task 1: Audio engine kurulumu (AC: 1)
  - [x] Subtask 1.1: Web Audio API entegrasyonu
  - [x] Subtask 1.2: Ritim sample'ları yükleme
  - [x] Subtask 1.3: Timing kontrolü

- [x] Task 2: Ritim testi UI (AC: 2, 5)
  - [x] Subtask 2.1: Tap buton tasarımı
  - [x] Subtask 2.2: Visual feedback (dalga efekti)
  - [x] Subtask 2.3: Zorluk seçici

- [x] Task 3: Ölçüm ve analiz (AC: 3, 4, 6)
  - [x] Subtask 3.1: Tepki süresi hesaplama
  - [x] Subtask 3.2: Doğruluk skoru algoritması
  - [x] Subtask 3.3: Performans kaydetme

## Dev Notes

### Rhythm Detection Algorithm

```typescript
interface RhythmResult {
  expectedTime: number;      // Beklenen vuruş zamanı (ms)
  actualTime: number;        // Gerçek vuruş zamanı (ms)
  deviation: number;         // Sapma (ms)
  accuracy: number;          // Doğruluk (0-100)
}

function calculateAccuracy(deviation: number): number {
  const tolerance = 100; // 100ms tolerans
  if (deviation <= tolerance) {
    return 100 - (deviation / tolerance) * 50;
  }
  return Math.max(0, 50 - (deviation - tolerance) / 10);
}
```

### Difficulty Levels

| Level | BPM | Pattern Complexity | Tolerance |
|-------|-----|-------------------|-----------|
| Kolay | 60-80 | 4/4 basic | 150ms |
| Orta | 80-100 | Syncopation | 100ms |
| Zor | 100-120 | Complex | 75ms |

### Project Structure Notes

- `src/pages/atolyeler/muzik/RhythmTest.tsx` - Ana bileşen
- `src/services/AudioService.ts` - Audio engine
- `src/hooks/useRhythmTracker.ts` - Ölçüm hook'u

### References

- [Source: src/pages/atolyeler/muzik/]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Completion Notes List

- Web Audio API ile ritim engine implementasyonu
- 3 zorluk seviyesi aktif
- Görsel feedback animasyonları
- Performans kayıt sistemi aktif

### File List

| File | Action |
|------|--------|
| `src/pages/atolyeler/muzik/RhythmTest.tsx` | Created |
| `src/services/AudioService.ts` | Created |
| `src/hooks/useRhythmTracker.ts` | Created |
