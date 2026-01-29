# Story 6.2: Package & Subscription Management

Status: completed

## Story

As a **admin**,
I want **paket ve abonelik yönetimi yapabilmek**,
so that **kullanıcı erişimlerini kontrol edebilleyim**.

## Acceptance Criteria

1. Admin paket oluşturabilmeli
2. Paketlere özellik ve fiyat tanımlayabilmeli
3. Kullanıcılara abonelik atayabilmeli
4. Abonelik süreleri takip edilebilmeli
5. Veritabanı şeması Foreign Key uyumlu olmalı

## Tasks / Subtasks

- [x] Task 1: Database schema tasarla (AC: 1, 2, 5)
  - [x] Subtask 1.1: `packages` tablosu oluştur
  - [x] Subtask 1.2: `user_subscriptions` tablosu oluştur
  - [x] Subtask 1.3: Foreign key'leri `profiles` tablosuna bağla

- [x] Task 2: Seed data ekle (AC: 1, 2)
  - [x] Subtask 2.1: Varsayılan paketler oluştur (Ücretsiz, Temel, Premium)
  - [x] Subtask 2.2: Fiyatlandırma ve özellik tanımla

- [x] Task 3: RLS politikaları yapılandır (AC: 3, 4)
  - [x] Subtask 3.1: Admin okuma/yazma izni
  - [x] Subtask 3.2: Kullanıcı kendi aboneliğini okuma izni

## Dev Notes

### Database Schema

```sql
-- packages table
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  duration_days INTEGER DEFAULT 30,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Seed Packages

| Package | Price | Duration | Features |
|---------|-------|----------|----------|
| Ücretsiz | ₺0 | - | Temel quiz, sınırlı oyun |
| Temel | ₺99 | 30 gün | Tüm quiz, sınırlı atölye |
| Premium | ₺199 | 30 gün | Tam erişim |

### Project Structure Notes

- `supabase/migrations/20260129_packages_subscriptions.sql` - Migration dosyası

### References

- [Source: supabase/migrations/20260129_packages_subscriptions.sql]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

- Conversation: eb630c42-ddef-4474-9351-754f8dcdd328
- Date: 2026-01-28/29

### Completion Notes List

- Migration oluşturuldu ve Supabase'de çalıştırıldı
- Foreign key auth.users → profiles olarak düzeltildi

### File List

| File | Action |
|------|--------|
| `supabase/migrations/20260129_packages_subscriptions.sql` | Created |
