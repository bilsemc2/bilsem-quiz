
import React, { useState } from 'react';
import { useAudio } from './contexts/AudioContext';
import { useAIAudio } from './contexts/AIAudioContext';
import { MicrophoneButton } from './components/MicrophoneButton';
import { AIAnalysisResponse } from './types';

const MELODIES = [
  ["C4", "E4", "G4", "E4"],
  ["D4", "F4", "A4", "G4", "F4"],
  ["G4", "E4", "F4", "D4", "C4"],
  ["C4", "D4", "E4", "F4", "G4", "A4"]
];

const MelodyPage: React.FC = () => {
  const { playNote, startAudioContext, isSamplerReady } = useAudio();
  const {
    startListening, stopListening, isListening,
    currentNote: _currentNote, audioLevel, capturedNotes, analyzePerformance
  } = useAIAudio();

  const [targetMelody, setTargetMelody] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startNewTest = async () => {
    await startAudioContext();
    const melody = MELODIES[Math.floor(Math.random() * MELODIES.length)];
    setTargetMelody(melody);
    setAnalysis(null);

    melody.forEach((note, i) => {
      setTimeout(() => playNote(note, "4n"), i * 600);
    });
  };

  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      setIsAnalyzing(true);
      const result = await analyzePerformance('melody', targetMelody, capturedNotes);
      setAnalysis(result);
      setIsAnalyzing(false);
    } else {
      await startListening();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Melodi Tekrarı</h2>
            <p className="text-slate-400 text-sm">Kısa melodiyi duyduğun gibi sesinle tekrarla.</p>
          </div>
          <button onClick={startNewTest} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
            Melodiyi Çal
          </button>
        </div>

        {targetMelody.length > 0 && (
          <div className="flex flex-col items-center space-y-12">
            <div className="w-full h-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center space-x-2 p-4 relative overflow-hidden">
              {targetMelody.map((_, i) => (
                <div key={i} className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-indigo-500 opacity-20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                </div>
              ))}
              <div className="text-[10px] font-black text-slate-300 absolute -bottom-6 left-1/2 -translate-x-1/2 uppercase tracking-widest">Melodi Akış Grafiği</div>
            </div>

            <MicrophoneButton isListening={isListening} audioLevel={audioLevel} onClick={handleMicToggle} disabled={!isSamplerReady} />

            <div className="text-center h-16 flex items-center justify-center w-full">
              {isListening && (
                <div className="flex flex-wrap justify-center gap-2">
                  {capturedNotes.map((n, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold animate-in zoom-in shadow-sm">
                      {n}
                    </div>
                  ))}
                  {capturedNotes.length === 0 && <span className="text-slate-300 italic animate-pulse">Melodiyi bekleniyor...</span>}
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center space-x-3 text-indigo-600 font-black animate-pulse bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <span className="text-xs uppercase tracking-widest">Melodi Gemini Tarafından Analiz Ediliyor...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {analysis && !isAnalyzing && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-5">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <h3 className="text-xl font-bold">Müzikal Geri Bildirim</h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm opacity-80 uppercase font-bold tracking-widest">Hafıza & Duyum:</span>
              <span className="text-lg font-black tracking-tighter">%{analysis.accuracy}</span>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 italic">"{analysis.detailedAnalysis}"</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <h4 className="text-emerald-800 font-black text-xs mb-3 uppercase tracking-widest">Güçlü Melodik Duyum</h4>
                <ul className="text-xs text-emerald-700 space-y-2">
                  {analysis.feedback.strengths.map((s, i) => <li key={i} className="flex items-center"><span className="mr-2">✓</span> {s}</li>)}
                </ul>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <h4 className="text-indigo-800 font-black text-xs mb-3 uppercase tracking-widest">Gelişim Önerisi</h4>
                <ul className="text-xs text-indigo-700 space-y-2">
                  {analysis.feedback.tips.map((t, i) => <li key={i} className="flex items-center"><span className="mr-2">💡</span> {t}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MelodyPage;
