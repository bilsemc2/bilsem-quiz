---
description: WCAG 2.2 Level AA accessibility audit
---

# SupaRank Accessibility (A11y) Audit

WCAG 2.2 Level AA erişilebilirlik denetimi.

## Kullanım
```
/suparank-a11y https://example.com
```

## WCAG 2.2 Kontrolleri

### Algılanabilirlik (Perceivable)
- [ ] Görsellerde alt text
- [ ] Video için altyazı
- [ ] Yeterli renk kontrastı (4.5:1)
- [ ] Metin boyutu değiştirilebilir
- [ ] Oryantasyon bağımsız

### İşletilebilirlik (Operable)
- [ ] Keyboard ile navigasyon
- [ ] Focus göstergesi görünür
- [ ] Animasyonları durdurma
- [ ] Skip link mevcut
- [ ] Touch target minimum 44x44px

### Anlaşılabilirlik (Understandable)
- [ ] Dil belirtilmiş (lang attribute)
- [ ] Form label'ları
- [ ] Hata mesajları açık
- [ ] Tutarlı navigasyon

### Sağlamlık (Robust)
- [ ] Valid HTML
- [ ] ARIA doğru kullanım
- [ ] Semantic HTML

## Kontrol Araçları
- axe DevTools
- WAVE
- Lighthouse Accessibility
- Color Contrast Analyzer
