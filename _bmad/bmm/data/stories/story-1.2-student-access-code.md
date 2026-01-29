# Story 1.2: Student Access Code System

Status: ready-for-dev

## Story

As a **öğretmen**,
I want **öğrencilerim için erişim kodları oluşturabilmek**,
so that **öğrenciler e-posta olmadan platforma erişebilsin**.

## Acceptance Criteria

1. Öğretmen 6 haneli benzersiz erişim kodu oluşturabilmeli
2. Kod belirli bir süre geçerli olmalı (varsayılan 7 gün)
3. Öğrenci kodla giriş yapabilmeli
4. Kullanılan kodlar tekrar kullanılamamalı
5. Öğretmen oluşturduğu kodları listeyebilmeli
6. Kod kullanım durumu takip edilebilmeli

## Tasks / Subtasks

- [ ] Task 1: Erişim kodu tablosu oluştur (AC: 1, 2, 4)
  - [ ] Subtask 1.1: `student_access_codes` tablosu migration
  - [ ] Subtask 1.2: Benzersiz kod üretme fonksiyonu
  - [ ] Subtask 1.3: Süre sonu kontrolü

- [ ] Task 2: Öğretmen panel UI (AC: 1, 5, 6)
  - [ ] Subtask 2.1: Kod oluşturma formu
  - [ ] Subtask 2.2: Kod listesi tablosu
  - [ ] Subtask 2.3: Durum badge'leri (aktif/kullanıldı/süresi doldu)

- [ ] Task 3: Öğrenci giriş akışı (AC: 3)
  - [ ] Subtask 3.1: Kod ile giriş formu
  - [ ] Subtask 3.2: Kod doğrulama ve kullanıcı oluşturma
  - [ ] Subtask 3.3: Öğretmen-öğrenci ilişkisi kurma

## Dev Notes

### Database Schema

```sql
CREATE TABLE student_access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_codes_code ON student_access_codes(code);
CREATE INDEX idx_access_codes_teacher ON student_access_codes(teacher_id);
```

### Code Generation

```typescript
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // I, O, 0, 1 hariç
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

### Project Structure Notes

- `src/pages/TeacherDashboard.tsx` - Öğretmen paneli
- `src/pages/StudentLoginPage.tsx` - Öğrenci giriş
- `supabase/migrations/` - Database migrations

### References

- [Source: docs/architecture.md#student-access]

## Dev Agent Record

### Agent Model Used

(To be filled after implementation)

### Completion Notes List

(To be filled after implementation)

### File List

| File | Action |
|------|--------|
| `supabase/migrations/XXXXXX_student_access_codes.sql` | Create |
| `src/pages/TeacherDashboard.tsx` | Modify |
| `src/pages/StudentLoginPage.tsx` | Create |
