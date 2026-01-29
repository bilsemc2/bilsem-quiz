
import React, { useState, useEffect } from 'react';
import { useAudio } from './contexts/AudioContext';
import { useAIAudio } from './contexts/AIAudioContext';
import { MicrophoneButton } from './components/MicrophoneButton';
import { AIAnalysisResponse } from './types';

const NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];

const SingleNotePage: React.FC = () => {
  const { playNote, startAudioContext, isSamplerReady } = useAudio();
  const { 
    startListening, 
    stopListening, 
    isListening, 
    currentNote, 
    audioLevel,
    capturedNotes,
    analyzePerformance 
  } = useAIAudio();

  const [targetNote, setTargetNote] = useState<string>("");
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startNewTest = async () => {
    await startAudioContext();
    const note = NOTES[Math.floor(Math.random() * NOTES.length)];
    setTargetNote(note);
    setAnalysis(null);
    playNote(note, "1n");
  };

  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      setIsAnalyzing(true);
      // capturedNotes içinden en çok tekrar eden veya son notayı alabiliriz
      const result = await analyzePerformance('single-note', [targetNote], capturedNotes);
      setAnalysis(result);
      setIsAnalyzing(false);
    } else {
      await startListening();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tek Nota Tekrarı</h2>
            <p className="text-slate-400 font-medium">Duyduğun notayı sesinle canlandır.</p>
          </div>
          <button 
            onClick={startNewTest}
            className="p-4 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-2xl transition-all active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {targetNote && (
          <div className="flex flex-col items-center space-y-12">
            <div className="relative">
              <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-indigo-200 shadow-2xl">
                <span className="text-4xl font-black text-white">{targetNote}</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold animate-bounce shadow-lg">?</div>
            </div>

            <div className="flex flex-col items-center space-y-6 w-full">
              <MicrophoneButton 
                isListening={isListening} 
                audioLevel={audioLevel} 
                onClick={handleMicToggle}
                disabled={!isSamplerReady}
              />
              
              <div className="h-20 flex flex-col items-center justify-center">
                {isListening && (
                  <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="text-5xl font-black text-emerald-500 tracking-tighter">
                      {currentNote || "---"}
                    </div>
                    <div className="text-xs font-bold text-slate-300 uppercase mt-2 tracking-widest">Seni Duyuyorum</div>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="flex items-center space-x-3 text-indigo-600 font-bold italic">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    <span>AI Analiz Ediyor...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10 duration-700">
          <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">✨</div>
              <h3 className="text-xl font-bold">Müzik Hocası Raporu</h3>
            </div>
            <div className="text-3xl font-black">%{analysis.accuracy}</div>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Güçlü Yönlerin</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.feedback.strengths.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold flex items-center">
                      <span className="mr-2">✓</span> {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Öneriler</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.feedback.tips.map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold flex items-center">
                      <span className="mr-2">💡</span> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative">
               <div className="text-slate-700 font-medium leading-relaxed italic">
                 "{analysis.detailedAnalysis}"
               </div>
               <div className="mt-4 text-indigo-600 font-black text-right">
                 {analysis.encouragement} 🚀
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleNotePage;
