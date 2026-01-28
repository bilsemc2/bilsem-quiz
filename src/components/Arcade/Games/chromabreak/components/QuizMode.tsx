
import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';

interface QuizModeProps {
  history: string[];
  level: number;
  onQuizComplete: (correct: boolean) => void;
}

// Yerel soru üreteci - Gemini API gerektirmez
const generateQuizQuestion = (history: string[], difficulty: number): QuizQuestion => {
  if (history.length === 0) {
    return {
      question: "Hiç blok vurdun mu?",
      options: ["Evet", "Hayır", "Belki", "Unuttum"],
      correctAnswer: "Hayır",
      explanation: "Bu turda hiç blok vurmadın!"
    };
  }

  const colors = ["Kırmızı", "Mavi", "Yeşil", "Sarı", "Mor", "Turuncu", "Pembe", "Cyan"];
  const questionTypes = [
    // Tip 1: Son renk
    () => {
      const lastColor = history[history.length - 1];
      const wrongOptions = colors.filter(c => c !== lastColor).slice(0, 3);
      return {
        question: "En son hangi rengi vurdun?",
        options: [lastColor, ...wrongOptions].sort(() => Math.random() - 0.5),
        correctAnswer: lastColor,
        explanation: `Dizindeki son renk ${lastColor} idi.`
      };
    },
    // Tip 2: İlk renk
    () => {
      const firstColor = history[0];
      const wrongOptions = colors.filter(c => c !== firstColor).slice(0, 3);
      return {
        question: "İlk hangi rengi vurdun?",
        options: [firstColor, ...wrongOptions].sort(() => Math.random() - 0.5),
        correctAnswer: firstColor,
        explanation: `Dizindeki ilk renk ${firstColor} idi.`
      };
    },
    // Tip 3: Toplam blok sayısı
    () => {
      const count = history.length;
      const wrongOptions = [count - 2, count + 1, count + 3].filter(n => n > 0).map(String);
      return {
        question: "Toplam kaç blok vurdun?",
        options: [String(count), ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5),
        correctAnswer: String(count),
        explanation: `Toplamda ${count} blok vurdun.`
      };
    },
    // Tip 4: Belirli pozisyondaki renk
    () => {
      const pos = Math.min(Math.floor(Math.random() * history.length), history.length - 1);
      const targetColor = history[pos];
      const wrongOptions = colors.filter(c => c !== targetColor).slice(0, 3);
      return {
        question: `${pos + 1}. sırada hangi rengi vurdun?`,
        options: [targetColor, ...wrongOptions].sort(() => Math.random() - 0.5),
        correctAnswer: targetColor,
        explanation: `${pos + 1}. sıradaki renk ${targetColor} idi.`
      };
    },
    // Tip 5: Belirli rengin sayısı
    () => {
      const targetColor = history[Math.floor(Math.random() * history.length)];
      const count = history.filter(c => c === targetColor).length;
      const wrongOptions = [count - 1, count + 1, count + 2].filter(n => n >= 0).map(String);
      return {
        question: `Kaç tane ${targetColor} blok vurdun?`,
        options: [String(count), ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5),
        correctAnswer: String(count),
        explanation: `${count} tane ${targetColor} blok vurdun.`
      };
    }
  ];

  // Zorluk seviyesine göre soru tiplerini filtrele
  const availableTypes = questionTypes.slice(0, Math.min(difficulty + 2, questionTypes.length));
  const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  
  return randomType();
};

const QuizMode: React.FC<QuizModeProps> = ({ history, level, onQuizComplete }) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const difficulty = Math.min(Math.ceil(level / 2), 5);
    const q = generateQuizQuestion(history, difficulty);
    setQuestion(q);
  }, [history, level]);

  const handleOptionClick = (option: string) => {
    if (showResult) return;
    setSelectedOption(option);
    setShowResult(true);
    
    setTimeout(() => {
      onQuizComplete(option === question?.correctAnswer);
    }, 3500);
  };

  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md">
      <div className="text-cyan-500 font-orbitron text-sm mb-2 uppercase tracking-widest">Hafıza Protokolü</div>
      <h2 className="text-2xl font-semibold mb-8 text-white leading-tight">
        {question.question}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {question.options.map((option, idx) => {
          const isCorrect = option === question.correctAnswer;
          const isSelected = option === selectedOption;
          
          let buttonClass = "p-4 text-left rounded-xl border transition-all duration-300 transform active:scale-95 ";
          if (showResult) {
            if (isCorrect) buttonClass += "bg-green-500/20 border-green-500 text-green-400 ring-2 ring-green-500/50";
            else if (isSelected) buttonClass += "bg-red-500/20 border-red-500 text-red-400 opacity-80";
            else buttonClass += "bg-slate-900/50 border-slate-700 text-slate-500 opacity-40";
          } else {
            buttonClass += "bg-slate-700/50 border-slate-600 hover:border-cyan-400 text-slate-200 hover:bg-slate-700";
          }

          return (
            <button
              key={idx}
              disabled={showResult}
              onClick={() => handleOptionClick(option)}
              className={buttonClass}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400 border border-slate-600">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className={`p-4 rounded-xl animate-fade-in ${selectedOption === question.correctAnswer ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          <p className="font-bold text-lg mb-1">
            {selectedOption === question.correctAnswer ? 'HARİKA HATIRLAMA!' : 'HAFIZA HATASI TESPİT EDİLDİ!'}
          </p>
          <p className="text-sm opacity-90">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuizMode;
