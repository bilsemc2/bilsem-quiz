# Story 1.1: User Registration Flow

Status: ready-for-dev

## Story

As a **yeni kullanıcı**,
I want **e-posta ile kayıt olabilmek**,
so that **platforma erişim sağlayabileyim**.

## Acceptance Criteria

1. Kullanıcı geçerli e-posta ve şifre ile kayıt olabilmeli
2. Şifre en az 6 karakter olmalı
3. E-posta doğrulama gönderilmeli
4. Kayıt sonrası profil sayfasına yönlendirilmeli
5. Duplicate e-posta kontrolü yapılmalı
6. Türkçe hata mesajları gösterilmeli

## Tasks / Subtasks

- [ ] Task 1: Kayıt formu UI (AC: 1, 2, 6)
  - [ ] Subtask 1.1: Form validasyonu ekle
  - [ ] Subtask 1.2: Şifre gücü göstergesi ekle
  - [ ] Subtask 1.3: Hata mesajlarını Türkçeleştir

- [ ] Task 2: Supabase Auth entegrasyonu (AC: 1, 3, 5)
  - [ ] Subtask 2.1: signUp fonksiyonunu implement et
  - [ ] Subtask 2.2: E-posta doğrulama akışını yapılandır
  - [ ] Subtask 2.3: Duplicate e-posta hatasını handle et

- [ ] Task 3: Post-registration flow (AC: 4)
  - [ ] Subtask 3.1: Profil oluşturma trigger'ı ekle
  - [ ] Subtask 3.2: Onboarding sayfasına yönlendir

## Dev Notes

### Supabase Auth Configuration

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: fullName,
    }
  }
});
```

### Project Structure Notes

- `src/pages/RegisterPage.tsx` - Kayıt sayfası
- `src/context/AuthContext.tsx` - Auth state management
- `supabase/functions/` - Edge functions

### References

- [Source: src/pages/RegisterPage.tsx]
- [Source: src/context/AuthContext.tsx]

## Dev Agent Record

### Agent Model Used

(To be filled after implementation)

### Completion Notes List

(To be filled after implementation)

### File List

| File | Action |
|------|--------|
| `src/pages/RegisterPage.tsx` | Modify |
| `src/context/AuthContext.tsx` | Modify |
