---
description: Internal and external link audit
---

# SupaRank Link Audit

İç ve dış link analizi.

## Kullanım
```
/suparank-links https://example.com
```

## Kontroller

### İç Linkler (Internal Links)
- [ ] Her sayfadan erişilebilir linkler
- [ ] Orphan sayfalar yok
- [ ] Anchor text anlamlı
- [ ] Kırık linkler yok (404)
- [ ] Redirect zincirleri yok

### Dış Linkler (External Links)
- [ ] rel="noopener noreferrer" mevcut
- [ ] Güvenilir sitelere link
- [ ] Kırık dış link yok
- [ ] Uygun anchor text

### Link Yapısı
- [ ] Hub sayfaları belirli
- [ ] Silo yapısı uygun
- [ ] Footer/header linkleri optimize

### Teknik Kontroller
- [ ] 301 redirect'ler doğru
- [ ] Canonical URL tutarlı
- [ ] Hreflang (çok dilli siteler için)

## Rapor Çıktısı
- Toplam iç link sayısı
- Toplam dış link sayısı
- Kırık link listesi
- Orphan sayfa listesi
