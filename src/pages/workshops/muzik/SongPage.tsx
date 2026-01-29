
import React, { useState } from 'react';
import { useAudio } from './contexts/AudioContext';
import { useAIAudio } from './contexts/AIAudioContext';
import { MicrophoneButton } from './components/MicrophoneButton';
import { AIAnalysisResponse } from './types';

const SONGS = [
  { 
    name: "Yaşasın Okulumuz", 
    melody: ["C4", "C4", "G4", "G4", "A4", "A4", "G4"], 
    lyrics: "Daha dün annemizin kollarında yaşarken..." 
  },
  { 
    name: "Twinkle Twinkle", 
    melody: ["C4", "C4", "G4", "G4", "A4", "A4", "G4"], 
    lyrics: "Twinkle twinkle little star, how I wonder what you are..." 
  }
];

const SongPage: React.FC = () => {
  const { playNote, startAudioContext, isSamplerReady } = useAudio();
  const { 
    startListening, stopListening, isListening, 
    currentNote, audioLevel, capturedNotes, analyzePerformance 
  } = useAIAudio();

  const [activeSong, setActiveSong] = useState<typeof SONGS[0] | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const playSongGuide = async () => {
    if (!activeSong) return;
    await startAudioContext();
    activeSong.melody.forEach((note, i) => {
      setTimeout(() => playNote(note, "4n"), i * 600);
    });
  };

  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      setIsAnalyzing(true);
      const result = await analyzePerformance('song', activeSong, capturedNotes);
      setAnalysis(result);
      setIsAnalyzing(false);
    } else {
      await startListening();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 bg-indigo-600 text-white">
          <h2 className="text-3xl font-black tracking-tight mb-2">Şarkı İcrası</h2>
          <p className="opacity-80 text-sm">Bir şarkı seç ve tüm yeteneğini sergile!</p>
        </div>

        <div className="p-8">
           <div className="grid grid-cols-2 gap-4 mb-10">
             {SONGS.map((song) => (
               <button
                 key={song.name}
                 onClick={() => { setActiveSong(song); setAnalysis(null); }}
                 className={`p-6 rounded-2xl border-2 transition-all text-left ${
                   activeSong?.name === song.name 
                   ? 'border-indigo-600 bg-indigo-50' 
                   : 'border-slate-100 hover:border-indigo-200'
                 }`}
               >
                 <div className="text-2xl mb-2">🎤</div>
                 <h4 className="font-bold text-slate-800">{song.name}</h4>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">{song.melody.length} Nota Uzunluğunda</p>
               </button>
             ))}
           </div>

           {activeSong && (
             <div className="flex flex-col items-center space-y-12 animate-in slide-in-from-top-4">
                <div className="text-center space-y-4 max-w-md">
                   <p className="text-xl font-medium text-slate-700 leading-relaxed italic">
                     "{activeSong.lyrics}"
                   </p>
                   <button 
                     onClick={playSongGuide}
                     className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100"
                   >
                     REHBER SESİ DİNLE
                   </button>
                </div>

                <div className="relative">
                  <MicrophoneButton isListening={isListening} audioLevel={audioLevel} onClick={handleMicToggle} disabled={!isSamplerReady} />
                  {isListening && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 text-center">
                       <div className="text-3xl font-black text-emerald-500 animate-pulse">{currentNote || "..."}</div>
                       <div className="text-[10px] font-bold text-slate-300 uppercase">Algılanan Nota</div>
                    </div>
                  )}
                </div>

                <div className="h-12 w-full flex justify-center items-end space-x-1">
                  {isListening && Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-indigo-400 rounded-full transition-all duration-75"
                      style={{ height: `${Math.random() * audioLevel + 10}%` }}
                    ></div>
                  ))}
                  {isAnalyzing && <div className="text-indigo-600 font-black animate-bounce tracking-widest text-xs uppercase">Performans Değerlendiriliyor...</div>}
                </div>
             </div>
           )}
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 animate-in slide-in-from-bottom-10 duration-700">
           <div className="flex justify-between items-start mb-10">
              <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tighter">PERFORMANS RAPORU</h3>
                 <p className="text-indigo-600 font-bold">{analysis.encouragement}</p>
              </div>
              <div className="bg-indigo-600 text-white w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-indigo-200">
                 <span className="text-2xl font-black">%{analysis.accuracy}</span>
                 <span className="text-[8px] font-bold uppercase opacity-70">BAŞARI</span>
              </div>
           </div>

           <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">NOTASYON</h5>
                 <p className="text-xs font-bold text-slate-700 leading-relaxed">{analysis.feedback.strengths[0] || "Nota doğruluğu başarılı."}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">RİTMİK DUYUM</h5>
                 <p className="text-xs font-bold text-slate-700 leading-relaxed">{analysis.feedback.strengths[1] || "Zamanlama dengeli."}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">MÜZİKALİTE</h5>
                 <p className="text-xs font-bold text-slate-700 leading-relaxed">{analysis.feedback.tips[0] || "İfade gücü yüksek."}</p>
              </div>
           </div>

           <div className="border-t pt-8">
              <h4 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Öğretmen Değerlendirmesi</h4>
              <p className="text-slate-600 italic text-sm leading-relaxed">"{analysis.detailedAnalysis}"</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default SongPage;
