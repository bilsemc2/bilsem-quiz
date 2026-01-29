
import React, { useState, useRef } from 'react';
import * as Tone from 'tone';
import { useAudio } from './contexts/AudioContext';
import { analyzeMusicPerformance } from './services/geminiService';
import { AIAnalysisResponse } from './types';

const RHYTHM_CHALLENGES = [
  {
    name: "Basit Dörtlük",
    p1: [1, 1, 1, 1],
    p2: [1, 1, 1, 1],
    areSame: true,
    desc: "Her iki ritim de 4 eşit vuruştan oluşuyor."
  },
  {
    name: "Vuruş Eksilmesi",
    p1: [1, 1, 1, 1],
    p2: [1, 1, 1],
    areSame: false,
    desc: "İkinci ritimde son vuruş eksik."
  },
  {
    name: "Zamanlama Kayması",
    p1: [1, 1, 1, 1],
    p2: [1, 0.5, 1.5, 1],
    areSame: false,
    desc: "İkinci ritimde vuruşların aralıkları (senkop) değişmiş."
  }
];

const RhythmDifferencePage: React.FC = () => {
  const { startAudioContext } = useAudio();
  const [activeChallenge, setActiveChallenge] = useState<typeof RHYTHM_CHALLENGES[0] | null>(null);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const noiseSynthRef = useRef<Tone.NoiseSynth | null>(null);

  const playChallenge = async () => {
    await startAudioContext();
    if (!noiseSynthRef.current) {
      noiseSynthRef.current = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
      }).toDestination();
    }

    const challenge = RHYTHM_CHALLENGES[Math.floor(Math.random() * RHYTHM_CHALLENGES.length)];
    setActiveChallenge(challenge);
    setUserChoice(null);
    setAnalysis(null);

    const now = Tone.now();
    let offset = 0;
    
    // 1. Ritim
    challenge.p1.forEach((dur) => {
      noiseSynthRef.current?.triggerAttackRelease("16n", now + offset);
      offset += dur * 0.6;
    });

    // Ara ver
    offset += 1.5;

    // 2. Ritim
    challenge.p2.forEach((dur) => {
      noiseSynthRef.current?.triggerAttackRelease("16n", now + offset);
      offset += dur * 0.6;
    });
  };

  const handleChoice = async (choice: boolean) => {
    setUserChoice(choice);
    setIsAnalyzing(true);
    const result = await analyzeMusicPerformance('rhythm-diff', activeChallenge, { userChoice: choice });
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ritim Farkı</h2>
            <p className="text-slate-400 text-sm">İki ritmi dinle, zamanlama farkını yakala.</p>
          </div>
          <button onClick={playChallenge} className="p-4 bg-amber-50 text-amber-600 rounded-2xl font-bold hover:bg-amber-100 transition-all">
            Ritimleri Dinlet
          </button>
        </div>

        {activeChallenge && (
          <div className="flex flex-col items-center space-y-12">
            <div className="flex space-x-12">
               <div className="flex flex-col items-center space-y-2">
                 <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">🥁</div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">1. Kalıp</span>
               </div>
               <div className="flex items-center text-slate-200 text-3xl font-light">vs</div>
               <div className="flex flex-col items-center space-y-2">
                 <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">🥁</div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">2. Kalıp</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <button 
                onClick={() => handleChoice(true)}
                disabled={userChoice !== null}
                className={`py-6 rounded-2xl font-black text-lg transition-all ${
                  userChoice === true ? 'bg-indigo-600 text-white scale-105 shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                AYNI
              </button>
              <button 
                onClick={() => handleChoice(false)}
                disabled={userChoice !== null}
                className={`py-6 rounded-2xl font-black text-lg transition-all ${
                  userChoice === false ? 'bg-indigo-600 text-white scale-105 shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                FARKLI
              </button>
            </div>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="text-center py-8 text-indigo-600 font-bold animate-pulse flex items-center justify-center space-x-2">
           <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
           <span>Zamanlama farkı AI tarafından ölçülüyor...</span>
        </div>
      )}

      {analysis && (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-500">
           <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black mb-6 ${
             (userChoice === activeChallenge?.areSame) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
           }`}>
             {(userChoice === activeChallenge?.areSame) ? 'DOĞRU CEVAP!' : 'YANLIŞ CEVAP!'}
           </div>
           
           <div className="space-y-6">
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Müzikal Detay</h4>
               <p className="text-slate-700 italic leading-relaxed">"{analysis.detailedAnalysis}"</p>
             </div>
             
             <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
               <span className="text-xs font-bold text-indigo-700">Ritmik Hassasiyet Puanı:</span>
               <span className="text-xl font-black text-indigo-600">%{analysis.accuracy}</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RhythmDifferencePage;
