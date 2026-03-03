
import React, { useState, useEffect } from 'react';
import { QuizQuestion, TIMING } from '../types';

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

  const colors = ["Kırmızı", "Mavi", "Yeşil", "Sarı", "Mor", "Turuncu", "Pembe", "Turkuaz"];
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
      // Fallback değerler ekleyerek her zaman 3 yanlış seçenek garanti et
      const candidates = [count - 2, count - 1, count + 1, count + 2, count + 3]
        .filter(n => n > 0 && n !== count);
      const wrongOptions = candidates.slice(0, 3).map(String);
      // Eksik seçenek varsa doldur
      while (wrongOptions.length < 3) {
        const fallback = count + wrongOptions.length + 4;
        wrongOptions.push(String(fallback));
      }
      return {
        question: "Toplam kaç blok vurdun?",
        options: [String(count), ...wrongOptions].sort(() => Math.random() - 0.5),
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
      // Fallback değerler ekleyerek her zaman 3 yanlış seçenek garanti et
      const candidates = [count - 2, count - 1, count + 1, count + 2, count + 3]
        .filter(n => n >= 0 && n !== count);
      const wrongOptions = candidates.slice(0, 3).map(String);
      while (wrongOptions.length < 3) {
        const fallback = count + wrongOptions.length + 4;
        wrongOptions.push(String(fallback));
      }
      return {
        question: `Kaç tane ${targetColor} blok vurdun?`,
        options: [String(count), ...wrongOptions].sort(() => Math.random() - 0.5),
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
    }, TIMING.QUIZ_RESULT_DELAY_MS);
  };

  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10 bg-amber-100 dark:bg-slate-800 rounded-[3rem] border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] font-black -rotate-1 relative mt-8 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-700 inline-block px-4 py-2 rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm rotate-2 text-black dark:text-white text-xs sm:text-sm mb-6 uppercase tracking-widest transition-colors duration-300">Hafıza Protokolü</div>
      <h2 className="text-2xl sm:text-3xl font-black mb-8 text-black dark:text-white leading-tight uppercase drop-shadow-[2px_2px_0_#fff] dark:drop-shadow-neo-sm transition-colors duration-300">
        {question.question}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {question.options.map((option, idx) => {
          const isCorrect = option === question.correctAnswer;
          const isSelected = option === selectedOption;

          let buttonClass = "p-4 sm:p-5 text-left rounded-3xl border-4 transition-all duration-300 transform font-black text-lg sm:text-xl uppercase tracking-wider ";
          if (showResult) {
            if (isCorrect) buttonClass += "bg-emerald-400 border-black/10 text-black shadow-neo-sm";
            else if (isSelected) buttonClass += "bg-rose-400 border-black/10 text-black shadow-none translate-y-2 opacity-80";
            else buttonClass += "bg-slate-300 dark:bg-slate-600 border-black/10 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-none opacity-50";
          } else {
            buttonClass += "bg-white dark:bg-slate-700 border-black/10 dark:border-slate-900 text-black dark:text-white shadow-neo-sm dark:shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm dark:hover:shadow-neo-sm hover:bg-sky-100 dark:hover:bg-slate-600 active:translate-y-2 active:shadow-none";
          }

          return (
            <button
              key={idx}
              disabled={showResult}
              onClick={() => handleOptionClick(option)}
              className={buttonClass}
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-black text-sm font-black border-2 border-black/10 shadow-neo-sm">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className={`mt-8 p-4 sm:p-6 rounded-3xl border-2 border-black/10 shadow-neo-sm animate-in slide-in-from-bottom-4 rotate-1 ${selectedOption === question.correctAnswer ? 'bg-emerald-200' : 'bg-rose-200'}`}>
          <p className="font-black text-xl sm:text-2xl mb-2 uppercase drop-shadow-[1px_1px_0_#fff] text-black">
            {selectedOption === question.correctAnswer ? 'HARİKA HATIRLAMA!' : 'HAFIZA HATASI!'}
          </p>
          <p className="text-black font-bold text-sm sm:text-base leading-relaxed bg-white/50 px-3 py-2 rounded-xl">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuizMode;
