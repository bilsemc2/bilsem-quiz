
import React, { useState } from 'react';
import { useAudio } from './contexts/AudioContext';
import { analyzeMusicPerformance } from './services/geminiService';
import { AIAnalysisResponse } from './types';

const CHALLENGES = [
  { 
    m1: ["C4", "E4", "G4"], 
    m2: ["C4", "E4", "G4"], 
    areSame: true, 
    desc: "Melodiler tam olarak aynı." 
  },
  { 
    m1: ["C4", "E4", "G4"], 
    m2: ["C4", "F4", "G4"], 
    areSame: false, 
    desc: "İkinci melodide 2. nota (E4 yerine F4) farklı." 
  },
  { 
    m1: ["G4", "F4", "D4", "C4"], 
    m2: ["G4", "F4", "D#4", "C4"], 
    areSame: false, 
    desc: "İkinci melodide 3. nota yarım ton pesleşmiş." 
  }
];

const MelodyDifferencePage: React.FC = () => {
  const { playNote, startAudioContext } = useAudio();
  const [activeChallenge, setActiveChallenge] = useState<typeof CHALLENGES[0] | null>(null);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startNewChallenge = async () => {
    await startAudioContext();
    const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    setActiveChallenge(challenge);
    setUserChoice(null);
    setAnalysis(null);

    // Birinci melodi
    challenge.m1.forEach((n, i) => setTimeout(() => playNote(n, "4n"), i * 500));
    
    // Ara ver ve ikinci melodi
    const delay = challenge.m1.length * 500 + 1000;
    challenge.m2.forEach((n, i) => setTimeout(() => playNote(n, "4n"), delay + i * 500));
  };

  const handleChoice = async (choice: boolean) => {
    setUserChoice(choice);
    setIsAnalyzing(true);
    
    const result = await analyzeMusicPerformance(
      'melody-diff', 
      { areSame: activeChallenge?.areSame, description: activeChallenge?.desc }, 
      { userChoice: choice }
    );
    
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Melodi Farkı</h2>
            <p className="text-slate-400 text-sm">İki melodiyi dinle ve aralarındaki farkı bul.</p>
          </div>
          <button onClick={startNewChallenge} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all">
            Dinletiyi Başlat
          </button>
        </div>

        {activeChallenge && (
          <div className="flex flex-col items-center space-y-12">
            <div className="flex space-x-12">
               <div className="flex flex-col items-center space-y-2">
                 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">🎹</div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">1. Melodi</span>
               </div>
               <div className="flex items-center text-slate-200 text-3xl font-light">vs</div>
               <div className="flex flex-col items-center space-y-2">
                 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">🎹</div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">2. Melodi</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <button 
                onClick={() => handleChoice(true)}
                disabled={userChoice !== null}
                className={`py-6 rounded-2xl font-black text-lg transition-all ${
                  userChoice === true ? 'bg-indigo-600 text-white scale-105' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
              >
                AYNI
              </button>
              <button 
                onClick={() => handleChoice(false)}
                disabled={userChoice !== null}
                className={`py-6 rounded-2xl font-black text-lg transition-all ${
                  userChoice === false ? 'bg-indigo-600 text-white scale-105' : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                FARKLI
              </button>
            </div>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="text-center py-12 animate-pulse text-indigo-600 font-bold">
          Gemini müzikal farkı analiz ediyor...
        </div>
      )}

      {analysis && (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in slide-in-from-bottom-5">
           <div className={`text-center py-2 px-6 rounded-full inline-block font-black text-sm mb-6 ${
             (userChoice === activeChallenge?.areSame) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
           }`}>
             {(userChoice === activeChallenge?.areSame) ? 'TEBRİKLER, DOĞRU TESPİT!' : 'MAALESEF, YANLIŞ TESPİT.'}
           </div>
           
           <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
             <h4 className="text-indigo-900 font-black text-xs uppercase mb-3 tracking-widest">Müzikal Analiz (Hoca Notu)</h4>
             <p className="text-indigo-800 text-sm leading-relaxed mb-4">"{analysis.detailedAnalysis}"</p>
             <div className="flex items-center space-x-2">
               <span className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-[10px] font-bold shadow-sm">
                 {activeChallenge?.areSame ? 'Statik Melodi' : 'Dinamik Değişim'}
               </span>
               <span className="text-[10px] text-indigo-400 font-medium italic">Gemini 3.0 Pro Engine tarafından üretildi.</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MelodyDifferencePage;
