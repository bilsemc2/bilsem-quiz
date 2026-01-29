# Adım 4: Uygulama

**Amaç:** AI müzik bileşenlerini tek tek implement et.

---

## 4.1 Epic 1: Mikrofon Altyapısı

### Story 1.1: Mikrofon İzni ve Stream
```typescript
// contexts/AIAudioContext.tsx
const startListening = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    audio: { 
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100 
    } 
  });
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
};
```

**Acceptance Criteria:**
- Given: Kullanıcı mikrofon iznini kabul etti
- When: startListening() çağrıldığında
- Then: Audio stream başlar ve analyser'a bağlanır

### Story 1.2: Mikrofon UI Komponenti
- [ ] Mikrofon açma/kapama butonu
- [ ] Ses seviyesi göstergesi
- [ ] İzin yoksa fallback mesajı

---

## 4.2 Epic 2: Pitch Detection

### Story 2.1: Pitch Detection Utility
```typescript
// utils/PitchDetector.ts
import { Aubio } from 'aubiojs';

export class PitchDetector {
  detect(buffer: Float32Array): { pitch: number; confidence: number } {
    // Autocorrelation veya FFT tabanlı detection
  }
  
  pitchToNote(pitch: number): string {
    // 440Hz → A4, etc.
  }
}
```

### Story 2.2: Real-time Feedback
- [ ] Algılanan nota gösterimi
- [ ] Hedef nota ile karşılaştırma
- [ ] Yeşil/kırmızı görsel feedback

---

## 4.3 Epic 3: Ritim Algılama

### Story 3.1: Beat Detection
```typescript
// utils/RhythmAnalyzer.ts
export class RhythmAnalyzer {
  detectBeat(buffer: Float32Array): boolean;
  calculateTempo(beats: number[]): number;
  comparePattern(target: number[], detected: number[]): number;
}
```

---

## 4.4 Epic 4: Gemini Entegrasyonu

### Story 4.1: Edge Function
```typescript
// supabase/functions/music-ai-proxy/index.ts
Deno.serve(async (req) => {
  const { userNotes, targetNotes, testType } = await req.json();
  
  const analysis = await gemini.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ 
      role: "user", 
      parts: [{ text: `Müzik performans analizi...` }]
    }]
  });
  
  return new Response(JSON.stringify(analysis));
});
```

---

## MENÜ

- **[C] Continue** → Adım 5'e geç (Test)
- **[I] Implement** → Seçili Epic'i implement et
- **[S] Skip** → Belirli Epic'i atla
