
import React, { useState } from 'react';
import { useAudio } from './contexts/AudioContext';
import { useAIAudio } from './contexts/AIAudioContext';
import { MicrophoneButton } from './components/MicrophoneButton';
import { AIAnalysisResponse } from './types';

const NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

const TripleNotePage: React.FC = () => {
  const { playNote, startAudioContext, isSamplerReady } = useAudio();
  const { 
    startListening, stopListening, isListening, 
    currentNote, audioLevel, capturedNotes, analyzePerformance 
  } = useAIAudio();

  const [targetNotes, setTargetNotes] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startNewTest = async () => {
    await startAudioContext();
    const n1 = NOTES[Math.floor(Math.random() * NOTES.length)];
    const n2 = NOTES[Math.floor(Math.random() * NOTES.length)];
    const n3 = NOTES[Math.floor(Math.random() * NOTES.length)];
    setTargetNotes([n1, n2, n3]);
    setAnalysis(null);
    
    // Notaları 800ms aralıklarla çal
    playNote(n1, "2n");
    setTimeout(() => playNote(n2, "2n"), 800);
    setTimeout(() => playNote(n3, "2n"), 1600);
  };

  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      setIsAnalyzing(true);
      const result = await analyzePerformance('triple-note', targetNotes, capturedNotes);
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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Üç Nota Tekrarı</h2>
            <p className="text-slate-400 text-sm">Üçlü nota dizisini duyduğun sırayla seslendir.</p>
          </div>
          <button onClick={startNewTest} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all font-bold">
            Yeni Dizi Çal
          </button>
        </div>

        {targetNotes.length > 0 && (
          <div className="flex flex-col items-center space-y-10">
            <div className="flex space-x-4">
              {targetNotes.map((note, i) => (
                <div key={i} className="group relative">
                  <div className="w-16 h-16 bg-white border-2 border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black shadow-sm group-hover:border-indigo-400 transition-colors">
                    {note}
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300 uppercase">{i + 1}. Nota</div>
                </div>
              ))}
            </div>

            <MicrophoneButton isListening={isListening} audioLevel={audioLevel} onClick={handleMicToggle} disabled={!isSamplerReady} />
            
            <div className="min-h-[60px] w-full flex flex-col items-center justify-center gap-2">
              {isListening && (
                <div className="flex flex-wrap justify-center gap-2">
                  {capturedNotes.map((n, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg font-bold text-sm animate-in zoom-in">
                      {n}
                    </span>
                  ))}
                  {capturedNotes.length === 0 && <span className="text-slate-300 italic animate-pulse">Seni dinliyorum...</span>}
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center space-x-3 text-indigo-600 font-black animate-pulse bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <span className="text-xs uppercase tracking-widest">Performans Analiz Ediliyor...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {analysis && !isAnalyzing && (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in slide-in-from-bottom-5">
           <div className="flex items-center justify-between mb-6 border-b pb-4">
             <div>
               <h3 className="text-xl font-bold text-slate-800">Başarı Skoru: %{analysis.accuracy}</h3>
               <p className="text-indigo-600 font-bold text-sm">{analysis.encouragement}</p>
             </div>
             <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
               {analysis.score > 80 ? 'A' : analysis.score > 60 ? 'B' : 'C'}
             </div>
           </div>
           
           <div className="space-y-6">
             <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
               "{analysis.detailedAnalysis}"
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neler İyiydi?</h4>
                 {analysis.feedback.strengths.map((s, i) => (
                   <div key={i} className="flex items-center space-x-2 text-xs font-bold text-emerald-700">
                     <span className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">✓</span>
                     <span>{s}</span>
                   </div>
                 ))}
               </div>
               <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nasıl Gelişir?</h4>
                 {analysis.feedback.tips.map((t, i) => (
                   <div key={i} className="flex items-center space-x-2 text-xs font-bold text-indigo-700">
                     <span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center">!</span>
                     <span>{t}</span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TripleNotePage;
