
export type TestType =
  | 'single-note'
  | 'double-note'
  | 'triple-note'
  | 'rhythm'
  | 'melody'
  | 'melody-diff'
  | 'rhythm-diff'
  | 'song';

export interface PerformanceResult {
  accuracy: number;
  correctNotes: number;
  totalNotes: number;
  feedback: string;
}

export interface AIAnalysisResponse {
  score: number;
  accuracy: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    tips: string[];
  };
  encouragement: string;
  detailedAnalysis: string;
}

export type MicrophonePermission = 'granted' | 'denied' | 'prompt';

export interface NoteSequenceResult {
  notes: string[];
  timings: number[];
  confidence: number;
}

export interface BeatDetectionResult {
  beats: number[];
  tempo: number | null;
  pattern: string;
}

export interface RhythmData {
  name: string;
  pattern: number[];
  tempo: number;
}

export interface SongData {
  name: string;
  melody: string[];
  lyrics: string;
}

export interface AIAudioContextType {
  startListening: () => Promise<void>;
  stopListening: () => void;
  isListening: boolean;
  microphonePermission: MicrophonePermission;
  currentPitch: number | null;
  currentNote: string | null;
  confidence: number;
  audioLevel: number;
  capturedNotes: string[];
  detectedBeats: number[];
  analyzePerformance: (type: TestType, target: string[] | RhythmData | SongData | null, detected: string[] | number[]) => Promise<AIAnalysisResponse>;
  resetCapture: () => void;
}
