# Story 5.1: XP Earning System

Status: completed

## Story

As a **öğrenci**,
I want **aktivitelerden XP kazanabilmek**,
so that **ilerlememi takip edebilleyim**.

## Acceptance Criteria

1. Quiz tamamlamada XP kazanılmalı
2. Simülatör tamamlamada XP kazanılmalı
3. Oyun oynamada XP kazanılmalı
4. XP bakiyesi anlık güncellenmeli
5. XP kazanım animasyonu gösterilmeli
6. XP geçmişi görüntülenebilmeli

## Tasks / Subtasks

- [x] Task 1: XP kazanım sistemi (AC: 1, 2, 3)
  - [x] Subtask 1.1: XP hesaplama algoritması
  - [x] Subtask 1.2: Aktivite bazlı XP oranları
  - [x] Subtask 1.3: Bonus XP (streak, first-time)

- [x] Task 2: XP state yönetimi (AC: 4)
  - [x] Subtask 2.1: Real-time güncelleme
  - [x] Subtask 2.2: Optimistic updates
  - [x] Subtask 2.3: Supabase sync

- [x] Task 3: UI/UX (AC: 5, 6)
  - [x] Subtask 3.1: XP kazanım toast/modal
  - [x] Subtask 3.2: Animasyonlu sayaç
  - [x] Subtask 3.3: XP geçmişi sayfası

## Dev Notes

### XP Calculation

| Aktivite | Base XP | Bonus Conditions |
|----------|---------|-----------------|
| Quiz (doğru cevap) | 10 | +5 streak bonus |
| Simülatör tamamlama | 25 | +10 first-time |
| Arcade oyun | 15 | +5 high score |
| Günlük giriş | 5 | +10 7-gün streak |

### XP Transaction Schema

```sql
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Project Structure Notes

- `src/hooks/useXP.ts` - XP yönetimi
- `src/components/XPDisplay.tsx` - XP gösterimi
- `src/context/XPContext.tsx` - Global XP state

### References

- [Source: src/hooks/useXP.ts]
- [Source: src/context/XPContext.tsx]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Completion Notes List

- XP sistemi tüm aktivitelere entegre
- Real-time güncelleme aktif
- Animasyonlu feedback mevcut

### File List

| File | Action |
|------|--------|
| `src/hooks/useXP.ts` | Created |
| `src/context/XPContext.tsx` | Created |
| `src/components/XPDisplay.tsx` | Created |
