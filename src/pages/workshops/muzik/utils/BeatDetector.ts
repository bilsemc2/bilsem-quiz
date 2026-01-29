
export class BeatDetector {
  private analyser: AnalyserNode;
  private threshold = 0.15; // Hassasiyet eşiği
  private lastBeatTime = 0;
  private minInterval = 150; // İki vuruş arası min ms (çift algılamayı önlemek için)

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
  }

  /**
   * Enerji tabanlı vuruş algılama
   */
  public detectBeat(buffer: Float32Array): boolean {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    const now = performance.now();

    if (rms > this.threshold && (now - this.lastBeatTime) > this.minInterval) {
      this.lastBeatTime = now;
      return true;
    }
    return false;
  }

  public getAudioLevel(buffer: Float32Array): number {
    let max = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > max) max = abs;
    }
    return Math.min(100, max * 200); // 0-100 arası ölçekle
  }
}
