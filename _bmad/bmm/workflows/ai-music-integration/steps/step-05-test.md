# Adım 5: Test ve Doğrulama

**Amaç:** AI müzik sistemini kapsamlı şekilde test et.

---

## 5.1 Unit Tests

### PitchDetector Tests
```typescript
describe('PitchDetector', () => {
  it('should detect A4 (440Hz) accurately', () => {
    const detector = new PitchDetector();
    const a4Buffer = generateSineWave(440);
    const result = detector.detect(a4Buffer);
    expect(result.pitch).toBeCloseTo(440, 1);
    expect(result.confidence).toBeGreaterThan(0.9);
  });
  
  it('should convert pitch to note correctly', () => {
    expect(detector.pitchToNote(440)).toBe('A4');
    expect(detector.pitchToNote(261.63)).toBe('C4');
  });
});
```

### RhythmAnalyzer Tests
```typescript
describe('RhythmAnalyzer', () => {
  it('should detect tempo from beat pattern', () => {
    const analyzer = new RhythmAnalyzer();
    const beats = [0, 500, 1000, 1500]; // 120 BPM
    expect(analyzer.calculateTempo(beats)).toBeCloseTo(120, 5);
  });
});
```

---

## 5.2 Integration Tests

### AIAudioContext Integration
```typescript
describe('AIAudioContext Integration', () => {
  it('should start listening and detect notes', async () => {
    const { result } = renderHook(() => useAIAudio());
    
    await act(async () => {
      await result.current.startListening();
    });
    
    expect(result.current.isListening).toBe(true);
  });
});
```

---

## 5.3 Manual Test Checklist

### Mikrofon Testleri
- [ ] Chrome'da mikrofon izni çalışıyor
- [ ] Safari'de mikrofon izni çalışıyor
- [ ] Firefox'ta mikrofon izni çalışıyor
- [ ] Mobil Chrome'da çalışıyor
- [ ] İzin reddedildiğinde fallback gösteriliyor

### Pitch Detection Testleri
- [ ] A4 nota doğru algılanıyor
- [ ] Tüm oktavlar doğru algılanıyor
- [ ] Gürültülü ortamda performans kabul edilebilir
- [ ] Latency 100ms altında

### Ritim Testleri
- [ ] Basit ritim (4/4) algılanıyor
- [ ] Tempo doğru hesaplanıyor
- [ ] Pattern karşılaştırma çalışıyor

### Gemini Entegrasyonu
- [ ] Edge function response < 3 saniye
- [ ] Analiz Türkçe ve anlamlı
- [ ] Rate limiting düzgün çalışıyor

---

## 5.4 Performance Metrics

| Metrik | Hedef | Ölçüm |
|--------|-------|-------|
| Pitch Detection Latency | < 50ms | |
| Note Accuracy | > 95% | |
| Tempo Detection Accuracy | ±5 BPM | |
| Gemini Response Time | < 3s | |
| Bundle Size Impact | < 500KB | |

---

## MENÜ

- **[C] Continue** → Adım 6'ya geç (Deploy)
- **[F] Fix** → Test hatalarını düzelt
- **[R] Re-run** → Testleri tekrar çalıştır
