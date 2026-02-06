---
description: Matrix Puzzle sistemine yeni mantıksal kural ekler
---

# Matrix Puzzle Kural Ekleme

Bu skill, Matrix Puzzle oyununa yeni bir mantıksal kural eklemek için kullanılır.

## ⚠️ KRİTİK KURALLAR

1. **Mantıksal Örüntü Zorunluluğu**: Her kural satır veya sütunda GÖZLEMLENEBİLİR bir örüntü oluşturmalı
2. **Tahmin Yasağı**: colorCycle gibi ezber gerektiren kurallar YASAKTIR
3. **Toggle Yasağı**: colorSwap, mirror gibi toggle operasyonları 3 sütunda düzgün çalışmaz

## 📋 MEVCUT KURALLAR (Tekrar Etme!)

### Easy (Seviye 1-5)
| ID | İsim | Açıklama | Transformation |
|----|------|----------|----------------|
| rotation-90-cw | Saat Yönünde Döndürme | Her hücre saat yönünde 90° döner | `rotate: 90` |
| rotation-90-ccw | Ters Yönde Döndürme | Her hücre ters yönde 90° döner | `rotate: -90` |
| rotation-180 | 180° Döndürme | Her hücre 180° döner | `rotate: 180` |
| scale-down | Boyut Küçülme | Her sütunda şekil küçülür | `scale: 0.8` |
| stroke-increase | Çerçeve Kalınlaşma | Her sütunda çerçeve kalınlaşır | `strokeIncrease: 2` |

### Medium (Seviye 6-10)
| ID | İsim | Açıklama | Transformation |
|----|------|----------|----------------|
| rotation-270 | 270° Döndürme | Her hücre 270° döner | `rotate: 270` |
| grid-row-shift | Satır Kaydırma | İç ızgara satırları aşağı kayar | `gridRowShift: down` |
| grid-col-shift | Sütun Kaydırma | İç ızgara sütunları sola kayar | `gridColShift: left` |
| grid-edge-delete | Kenar Silme | Her adımda kenar hücreleri silinir | `gridEdgeDelete` |
| grid-diagonal-shift | Çapraz Kaydırma | Hücreler çapraz yönde kayar | `gridDiagonalShift` |

### Hard (Seviye 11-15)
| ID | İsim | Açıklama | Transformation |
|----|------|----------|----------------|
| rotation-scale | Döndür + Küçült | 90° döndür + boyut küçült | `rotate: 90 + scale: 0.85` |
| grid-rotate-90 | İç Izgara Döndürme | İç ızgara 90° döner | `gridRotate: 90` |
| grid-shift-both | Çift Yönlü Kaydırma | 2.sütun: aşağı, 3.sütun: sağa | `gridShiftAlternating` |
| grid-cell-invert | Hücre Tersine Çevirme | Hücreler adım adım tersine | `gridCellInvert` |

### Expert (Seviye 16-20)
| ID | İsim | Açıklama | Transformation |
|----|------|----------|----------------|
| complex-grid-rotate | Karmaşık Izgara | 90° döndür + ızgara 90° döndür | `rotate: 90 + gridRotate: 90` |
| scale-grid-shift | Boyut + Izgara | Küçült + satır aşağı kaydır | `scale: 0.8 + gridRowShift: down` |
| rotation-grid-both | Çift Dönüşüm | 180° döndür + sütun kaydır | `rotate: 180 + gridColShift: right` |
| grid-invert-rotate | Izgara Ters + Döndür | Hücre tersine + 90° döndür | `gridCellInvert + rotate: 90` |

## 🛠️ YENİ KURAL EKLEME ADIMLARI

### Adım 1: Transformation Tipi Ekle (Gerekirse)
Dosya: `src/types/matrixRules.ts`

```typescript
// İç ızgara dönüşümleri bölümüne ekle
| { type: 'yeniTransformTipi'; parametre?: number }
```

### Adım 2: Executor Fonksiyonu Ekle
Dosya: `src/utils/ruleExecutors.ts`

```typescript
// Helper fonksiyon ekle:
export function applyYeniTransform(shape: BaseShape, step: number): BaseShape {
    if (!shape.innerGrid) return shape; // Grid gerekirse kontrol et
    
    // Step bazlı mantık - her step görsel değişiklik üretmeli
    const cells = shape.innerGrid.cells.map(row => [...row]);
    
    // Step 0: Orijinal
    // Step 1: İlk değişiklik
    // Step 2: İkinci değişiklik
    
    return {
        ...shape,
        innerGrid: { ...shape.innerGrid, cells },
    };
}

// switch içine case ekle:
case 'yeniTransformTipi':
    return applyYeniTransform(shape, step);
```

### Adım 3: Kural Tanımı Ekle
Zorluk seviyesine göre uygun dosyaya ekle:
- Easy: `src/data/matrixRules/easyRules.ts` (tek basit dönüşüm)
- Medium: `src/data/matrixRules/mediumRules.ts` (iç ızgara başlangıcı)
- Hard: `src/data/matrixRules/hardRules.ts` (ikili kombinasyonlar)
- Expert: `src/data/matrixRules/expertRules.ts` (karmaşık kombinasyonlar)

```typescript
{
    id: 'kural-id',
    name: 'Kural Adı',
    description: 'Kullanıcının anlayacağı açıklama',
    direction: 'row',
    difficulty: 'medium', // easy | medium | hard | expert
    transformations: [{ type: 'yeniTransformTipi' }],
},
```

### Adım 4: ShapeRenderer Güncelle (Gerekirse)
Dosya: `src/components/BrainTrainer/matrix/ShapeRenderer.tsx`

Yeni görsel özellik gerekiyorsa (örn: strokeWidth):
1. `renderShape` fonksiyonuna parametre ekle
2. SVG elementlerine props olarak geçir
3. Split shapes için de aynısını yap

## ✅ MANTIKSAL ÖRÜNTÜ KONTROL LİSTESİ

Yeni kural eklerken şunları kontrol et:

- [ ] Step 0 → Step 1 → Step 2 arasında GÖRSEL fark var mı?
- [ ] Kullanıcı 2 hücreye bakarak 3. hücreyi MANTIK ile tahmin edebilir mi?
- [ ] Kural EZİR gerektirmiyor mu (rastgele renk sırası YOK)?
- [ ] Toggle değil, PROGRESSIVE mi (her step'te devam ediyor)?
- [ ] Inner grid kullanıyorsa, grid şekillerde test edildi mi?

## 🔧 KULLANILAN TRANSFORMATION TİPLERİ

| Tip | Parametreler | Açıklama |
|-----|--------------|----------|
| `rotate` | degrees: 90/180/270/-90 | Şekli döndürür |
| `scale` | factor: 0.6-1.0 | Boyutu değiştirir |
| `strokeIncrease` | step: number | Çerçeve kalınlaştırır |
| `gridRowShift` | direction: up/down | Satırları kaydırır |
| `gridColShift` | direction: left/right | Sütunları kaydırır |
| `gridRotate` | degrees: 90/180/270 | İç ızgarayı döndürür |
| `gridCellInvert` | - | Hücreleri tersine çevirir |
| `gridShiftAlternating` | - | Step bazlı farklı kaydırma |
| `gridEdgeDelete` | - | Kenar hücrelerini siler |
| `gridDiagonalShift` | - | Çapraz yönde kaydırır |

## ❌ KULLANILMAYAN (YASAK) TRANSFORMASYONLAR

| Tip | Sebep |
|-----|-------|
| `colorCycle` | Ezber gerektirir, mantıksal değil |
| `colorSwap` | Toggle - 3 sütunda sorun çıkarır |
| `mirror` | Toggle - 3 sütunda sorun çıkarır |
| `colorInvert` | Renk örüntüsü takibi zor |
