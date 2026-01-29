
import React from 'react';

interface Props {
  isListening: boolean;
  audioLevel: number;
  onClick: () => void;
  disabled?: boolean;
}

export const MicrophoneButton: React.FC<Props> = ({ isListening, audioLevel, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group flex items-center justify-center w-20 h-20 rounded-full transition-all shadow-xl active:scale-90 ${
        isListening ? 'bg-red-500 text-white' : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50'
      }`}
    >
      {isListening && (
        <div 
          className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping"
          style={{ transform: `scale(${1 + audioLevel / 100})` }}
        ></div>
      )}
      
      <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24">
        {isListening ? (
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        ) : (
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        )}
      </svg>
      
      <div className="absolute -bottom-10 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-slate-400">
        {isListening ? 'Analizi Bitir' : 'Mikrofonu Aç'}
      </div>
    </button>
  );
};
