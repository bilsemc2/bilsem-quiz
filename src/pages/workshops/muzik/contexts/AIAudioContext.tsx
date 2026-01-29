
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetector } from '../utils/PitchDetector';
import { BeatDetector } from '../utils/BeatDetector';
import { AIAudioContextType, MicrophonePermission, TestType } from '../types';
import { analyzeMusicPerformance } from '../services/geminiService';

const AIAudioContext = createContext<AIAudioContextType | undefined>(undefined);

export const AIAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<MicrophonePermission>('prompt');
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [capturedNotes, setCapturedNotes] = useState<string[]>([]);
  const [detectedBeats, setDetectedBeats] = useState<number[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const detectorRef = useRef<PitchDetector | null>(null);
  const beatDetectorRef = useRef<BeatDetector | null>(null);
  // Fix: Added null as initial value for animationFrameRef to resolve "Expected 1 arguments, but got 0" error.
  const animationFrameRef = useRef<number | null>(null);
  const lastCapturedNoteRef = useRef<string | null>(null);

  const resetCapture = useCallback(() => {
    setCapturedNotes([]);
    setDetectedBeats([]);
    lastCapturedNoteRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (!detectorRef.current) detectorRef.current = new PitchDetector(audioCtxRef.current);
      
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = detectorRef.current.getAnalyser();
      if (!beatDetectorRef.current) beatDetectorRef.current = new BeatDetector(analyser);
      
      source.connect(analyser);
      setIsListening(true);
      resetCapture();

      const buffer = new Float32Array(analyser.fftSize);
      
      const update = () => {
        analyser.getFloatTimeDomainData(buffer);
        
        // Pitch Detection
        const pitchRes = detectorRef.current?.detect(buffer);
        if (pitchRes) {
          setCurrentPitch(pitchRes.pitch);
          const note = detectorRef.current!.pitchToNote(pitchRes.pitch);
          setCurrentNote(note);
          setConfidence(pitchRes.confidence);

          // Nota dizisi yakalama (stabil nota ise ekle)
          if (pitchRes.confidence > 0.9 && note !== lastCapturedNoteRef.current) {
            setCapturedNotes(prev => [...prev, note]);
            lastCapturedNoteRef.current = note;
          }
        } else {
          setCurrentPitch(null);
          setCurrentNote(null);
          setConfidence(0);
          lastCapturedNoteRef.current = null;
        }

        // Beat Detection
        if (beatDetectorRef.current?.detectBeat(buffer)) {
          setDetectedBeats(prev => [...prev, performance.now()]);
        }

        // Ses Seviyesi
        setAudioLevel(beatDetectorRef.current?.getAudioLevel(buffer) || 0);
        
        animationFrameRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      setMicrophonePermission('denied');
      setIsListening(false);
    }
  }, [resetCapture]);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsListening(false);
  }, []);

  const analyzePerformance = useCallback(async (type: TestType, target: any, detected: any) => {
    return await analyzeMusicPerformance(type, target, detected);
  }, []);

  return (
    <AIAudioContext.Provider value={{
      startListening,
      stopListening,
      isListening,
      microphonePermission,
      currentPitch,
      currentNote,
      confidence,
      audioLevel,
      capturedNotes,
      detectedBeats,
      analyzePerformance,
      resetCapture
    }}>
      {children}
    </AIAudioContext.Provider>
  );
};

export const useAIAudio = () => {
  const context = useContext(AIAudioContext);
  if (!context) throw new Error("useAIAudio must be used within AIAudioProvider");
  return context;
};
