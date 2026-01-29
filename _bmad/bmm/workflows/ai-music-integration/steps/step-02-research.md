# Adım 2: AI Teknolojileri Araştırması

**Amaç:** Müzik AI için uygun teknolojileri belirle ve karşılaştır.

---

## 2.1 Ses Tanıma Teknolojileri

### Option A: TensorFlow.js + Pitch Detection
```typescript
import * as tf from '@tensorflow/tfjs';
import { PitchDetector } from 'pitchy';

// Mikrofon → FFT → Pitch → Nota
```
**Artıları:** Tamamen client-side, hızlı
**Eksileri:** Model boyutu (~2MB)

### Option B: Web Audio API Native
```typescript
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
// Autocorrelation ile pitch detection
```
**Artıları:** Sıfır bağımlılık
**Eksileri:** Daha az doğru

### Option C: ml5.js (CREPE Model)
```typescript
import ml5 from 'ml5';
const pitch = ml5.pitchDetection(model, audioContext);
```
**Artıları:** Yüksek doğruluk
**Eksileri:** 4MB model

---

## 2.2 Ritim Algılama

### Beat Detection Algoritmaları
1. **Energy-based**: Ses seviyesi değişikliklerini izle
2. **Onset Detection**: Nota başlangıçlarını tespit
3. **Tempo Estimation**: BPM hesaplama

---

## 2.3 LLM Entegrasyonu (Gemini)

```typescript
// Supabase Edge Function
const analysis = await geminiProxy({
  model: "gemini-2.0-flash",
  prompt: `Müzik performans analizi: ${userNotes} vs ${targetNotes}`
});
```

**Kullanım Alanları:**
- Kişiselleştirilmiş geri bildirim
- Öğrenme önerileri
- Performans raporu

---

## 2.4 Teknoloji Seçim Matrisi

| Özellik | TF.js | Native | ml5.js | Gemini |
|---------|-------|--------|--------|--------|
| Doğruluk | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | N/A |
| Hız | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| Bundle Size | 2MB | 0 | 4MB | 0 |
| Offline | ✓ | ✓ | ✓ | ✗ |

---

## MENÜ

- **[C] Continue** → Adım 3'e geç (Teknik Tasarım)
- **[R] Revise** → Araştırmayı genişlet
- **[S] Select** → Teknoloji seçimini onayla
