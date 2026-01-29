
/**
 * PitchDetector Sınıfı
 * Autocorrelation algoritması kullanarak ses sinyalinden frekans (pitch) çıkarır.
 */
export class PitchDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private MIN_SAMPLES = 0; 
  private GOOD_ENOUGH_CORRELATION = 0.9;

  // Nota isimleri dizisi
  private noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  public getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  /**
   * Tampon bellekten (buffer) pitch algılama (Autocorrelation)
   */
  public detect(buffer: Float32Array): { pitch: number; confidence: number } | null {
    const SIZE = buffer.length;
    let sum = 0;
    for (let i = 0; i < SIZE; i++) {
      sum += buffer[i] * buffer[i];
    }
    
    // Ses seviyesi çok düşükse null dön
    const rms = Math.sqrt(sum / SIZE);
    if (rms < 0.01) return null;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const buf = buffer.slice(r1, r2);
    const L = buf.length;

    const c = new Array(L).fill(0);
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < L; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    
    // Parabolik interpolasyon ile hassas frekans bulma
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a !== 0) T0 = T0 - b / (2 * a);

    const pitch = this.audioContext.sampleRate / T0;
    const confidence = maxval / c[0];

    // İnsan sesi veya müzik aleti için mantıklı sınırlar (50Hz - 2000Hz)
    if (pitch > 50 && pitch < 2000 && confidence > 0.8) {
      return { pitch, confidence };
    }

    return null;
  }

  /**
   * Frekansı bilimsel nota gösterimine çevirir (Örn: 440 Hz -> A4)
   */
  public pitchToNote(frequency: number): string {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const roundedNote = Math.round(noteNum) + 69;
    const octave = Math.floor(roundedNote / 12) - 1;
    const noteIndex = roundedNote % 12;
    return this.noteStrings[noteIndex] + octave;
  }

  /**
   * Notayı frekansa çevirir (Örn: A4 -> 440 Hz)
   */
  public noteToPitch(note: string): number {
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));
    const noteIndex = this.noteStrings.indexOf(noteName);
    const noteNum = (octave + 1) * 12 + noteIndex;
    return 440 * Math.pow(2, (noteNum - 69) / 12);
  }
}
