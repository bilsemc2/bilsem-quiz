---
name: ai-music-integration
description: Müzik Atölyesi için yapay zeka entegrasyonu - ses tanıma, ritim algılama, melodi analizi
main_config: '{project-root}/_bmad/bmm/config.yaml'
web_bundle: true
version: '1.0.0'
author: 'BilsemC2 Team'

# Output configuration
output_folder: '{project-root}/_bmad-output/ai-music'

# Sub-workflow references
quick_dev_workflow: '{project-root}/_bmad/bmm/workflows/bmad-quick-flow/quick-dev/workflow.md'
document_project: '{project-root}/_bmad/bmm/workflows/document-project/workflow.yaml'
---

# AI Music Integration Workflow

**Amaç:** Müzik atölyesine yapay zeka tabanlı ses tanıma, ritim algılama ve melodi analizi özelliklerini entegre etmek.

**Hedefler:**
- 🎵 Gerçek zamanlı ses/nota tanıma
- 🥁 Ritim pattern algılama ve değerlendirme
- 🎹 Melodi karşılaştırma AI
- 📊 AI destekli performans analizi

---

## WORKFLOW MİMARİSİ

Bu workflow **step-file architecture** kullanır:

### Temel Prensipler

- Her adım bağımsız bir instruction dosyası
- Sıralı yürütme - atlama yok
- Durum takibi output dosyasında
- Append-only building

---

## BAŞLATMA SEKANSİ

### 1. Konfigürasyon Yükleme

`{main_config}` dosyasından yükle:
- `project_name`, `output_folder`
- `communication_language` → Türkçe
- `document_output_language` → Türkçe

### 2. İlk Adım

Read fully and follow: `steps/step-01-assess.md`

---

## WORKFLOW ADIMLARI

| Adım | Dosya | Açıklama |
|------|-------|----------|
| 1 | step-01-assess.md | Mevcut sistem analizi |
| 2 | step-02-research.md | AI teknolojileri araştırması |
| 3 | step-03-design.md | Teknik mimari tasarımı |
| 4 | step-04-implement.md | Uygulama adımları |
| 5 | step-05-test.md | Test ve doğrulama |
| 6 | step-06-deploy.md | Yayınlama ve entegrasyon |

---

## MENÜ SEÇENEKLERİ

Her adımda kullanıcıya sunulacak:

- **[C] Continue** - Sonraki adıma geç
- **[R] Revise** - Mevcut adımı düzenle
- **[Q] Questions** - Soru sor
- **[E] Exit** - Workflow'dan çık
