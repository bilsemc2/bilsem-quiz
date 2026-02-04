
import React, { useState } from 'react';
import { useAudio } from './contexts/AudioContext';
import { useAIAudio } from './contexts/AIAudioContext';
import { MicrophoneButton } from './components/MicrophoneButton';
import { AIAnalysisResponse } from './types';

const NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];

const DoubleNotePage: React.FC = () => {
  const { playNote, startAudioContext, isSamplerReady } = useAudio();
  const {
    startListening, stopListening, isListening,
    currentNote: _currentNote, audioLevel, capturedNotes, analyzePerformance
  } = useAIAudio();

  const [targetNotes, setTargetNotes] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startNewTest = async () => {
    await startAudioContext();
    const n1 = NOTES[Math.floor(Math.random() * NOTES.length)];
    const n2 = NOTES[Math.floor(Math.random() * NOTES.length)];
    setTargetNotes([n1, n2]);
    setAnalysis(null);

    // Notaları sırayla çal
    playNote(n1, "2n");
    setTimeout(() => playNote(n2, "2n"), 800);
  };

  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      setIsAnalyzing(true);
      const result = await analyzePerformance('double-note', targetNotes, capturedNotes);
      setAnalysis(result);
      setIsAnalyzing(false);
    } else {
      await startListening();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">İki Nota Tekrarı</h2>
            <p className="text-slate-400 text-sm">Notaları duyduğun sırayla mikrofona söyle.</p>
          </div>
          <button onClick={startNewTest} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-bold transition-all">
            Yeni Test
          </button>
        </div>

        {targetNotes.length > 0 && (
          <div className="flex flex-col items-center space-y-10">
            <div className="flex space-x-4">
              {targetNotes.map((note, i) => (
                <div key={i} className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100">
                  {note}
                </div>
              ))}
            </div>

            <MicrophoneButton isListening={isListening} audioLevel={audioLevel} onClick={handleMicToggle} disabled={!isSamplerReady} />

            <div className="h-16 flex flex-col items-center justify-center w-full">
              {isListening && (
                <div className="flex flex-wrap justify-center gap-2">
                  {capturedNotes.map((n, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm animate-in zoom-in">
                      {n}
                    </span>
                  ))}
                  {capturedNotes.length === 0 && <span className="text-slate-300 italic animate-pulse">Seni dinliyorum...</span>}
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center space-x-3 text-indigo-600 font-black animate-pulse bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <span className="text-xs uppercase tracking-widest">Gemini Analiz Ediyor...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {analysis && !isAnalyzing && (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Sonuç Raporu (%{analysis.accuracy})</h3>
            <div className="text-2xl">⭐</div>
          </div>
          <p className="text-slate-600 italic mb-6">"{analysis.detailedAnalysis}"</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl">
              <h4 className="text-xs font-black text-emerald-700 uppercase mb-2">Başarılar</h4>
              <ul className="text-sm text-emerald-800 space-y-1">
                {analysis.feedback.strengths.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl">
              <h4 className="text-xs font-black text-indigo-700 uppercase mb-2">Öneriler</h4>
              <ul className="text-sm text-indigo-800 space-y-1">
                {analysis.feedback.tips.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubleNotePage;
