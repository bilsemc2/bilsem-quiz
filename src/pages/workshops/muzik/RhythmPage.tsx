
import React, { useState, useRef } from 'react';
import * as Tone from 'tone';
import { useAIAudio } from './contexts/AIAudioContext';
import { MicrophoneButton } from './components/MicrophoneButton';
import { AIAnalysisResponse } from './types';

const RHYTHMS = [
  { name: "Basit 4/4", pattern: [1, 1, 1, 1], tempo: 100 },
  { name: "Senkop", pattern: [1, 0.5, 0.5, 1], tempo: 90 },
  { name: "Hızlı Tıklar", pattern: [0.5, 0.5, 0.5, 0.5, 1], tempo: 110 }
];

const RhythmPage: React.FC = () => {
  const { startListening, stopListening, isListening, audioLevel, detectedBeats, analyzePerformance } = useAIAudio();
  const [activeRhythm, setActiveRhythm] = useState<typeof RHYTHMS[0] | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const noiseSynthRef = useRef<Tone.NoiseSynth | null>(null);

  const playRhythm = async () => {
    await Tone.start();
    if (!noiseSynthRef.current) {
      noiseSynthRef.current = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
      }).toDestination();
    }

    const rhythm = RHYTHMS[Math.floor(Math.random() * RHYTHMS.length)];
    setActiveRhythm(rhythm);
    setAnalysis(null);

    const now = Tone.now();
    let timeOffset = 0;
    rhythm.pattern.forEach((dur) => {
      noiseSynthRef.current?.triggerAttackRelease("16n", now + timeOffset);
      timeOffset += dur * (60 / rhythm.tempo);
    });
  };

  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      setIsAnalyzing(true);
      // Vuruşların göreceli zamanlamalarını gönder
      const relativeBeats = detectedBeats.map((b, i, arr) => i === 0 ? 0 : b - arr[0]);
      const result = await analyzePerformance('rhythm', activeRhythm, relativeBeats);
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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ritim Tekrarı</h2>
            <p className="text-slate-400 text-sm">Duyduğun ritmi el çırparak tekrar et.</p>
          </div>
          <button onClick={playRhythm} className="p-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all active:scale-95 font-bold">
            🥁 Ritim Çal
          </button>
        </div>

        {activeRhythm && (
          <div className="flex flex-col items-center space-y-10 py-10">
             <div className="flex space-x-2">
                {activeRhythm.pattern.map((p, i) => (
                  <div key={i} className={`h-12 rounded-full bg-slate-100 flex items-center justify-center transition-all ${p === 1 ? 'w-16 bg-amber-200 border-2 border-amber-400' : 'w-8'}`}>
                    {p === 1 && "•"}
                  </div>
                ))}
             </div>

             <MicrophoneButton isListening={isListening} audioLevel={audioLevel} onClick={handleMicToggle} />

             <div className="flex flex-col items-center space-y-4 min-h-[60px]">
               <div className="flex space-x-2">
                  {detectedBeats.map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce shadow-sm"></div>
                  ))}
               </div>
               {isListening && detectedBeats.length === 0 && <span className="text-slate-300 italic animate-pulse">Vuruş bekleniyor...</span>}
               {isAnalyzing && (
                <div className="flex items-center space-x-3 text-indigo-600 font-black animate-pulse bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <span className="text-xs uppercase tracking-widest">Ritim Analiz Ediliyor...</span>
                </div>
              )}
             </div>
          </div>
        )}
      </div>

      {analysis && !isAnalyzing && (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg">Ritim Analizi (%{analysis.accuracy})</h3>
             <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black">AI DEĞERLENDİRMESİ</span>
           </div>
           <p className="text-slate-600 text-sm mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl">"{analysis.detailedAnalysis}"</p>
           <div className="space-y-3">
             {analysis.feedback.improvements.map((imp, i) => (
               <div key={i} className="flex items-center space-x-2 text-amber-700 bg-amber-50 p-2 rounded-lg text-xs font-bold">
                 <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">!</span> 
                 <span>{imp}</span>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default RhythmPage;
