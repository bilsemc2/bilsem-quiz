import React, { useState, useEffect, useCallback } from 'react';
import Clock from './components/Clock';
import { getRandomTime, addMinutes } from './utils/clockUtils';
import { getTeacherFeedback } from './services/geminiService';
import { Play, Check, RefreshCw, MessageCircle, Star } from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [questionTime, setQuestionTime] = useState<Date>(new Date());
  const [targetOffset, setTargetOffset] = useState<number>(5); // 5 or 10
  const [userMinutes, setUserMinutes] = useState<number>(0);
  const [displayHour, setDisplayHour] = useState<number>(0);
  
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("Hazır olduğunda başlayalım! Yelkovanı hareket ettir.");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const [gameActive, setGameActive] = useState<boolean>(true);

  // Initialize Game
  const startNewRound = useCallback(() => {
    const newTime = getRandomTime();
    const newOffset = Math.random() > 0.5 ? 5 : 10;
    
    setQuestionTime(newTime);
    setTargetOffset(newOffset);
    
    // Set initial clock to start time
    setUserMinutes(newTime.getMinutes());
    setDisplayHour(newTime.getHours());
    
    setIsCorrect(null);
    setFeedback("");
    setGameActive(true);
  }, []);

  useEffect(() => {
    // Initial load
    startNewRound();
  }, [startNewRound]);

  // Handle User Interaction
  const handleMinuteChange = (newMinutes: number) => {
    if (!gameActive) return;
    setUserMinutes(newMinutes);
    
    // Logic to handle hour wrapping visually
    // If the question is 11:55 + 10 mins = 12:05
    // Start min: 55. Target min: 05.
    // If user is near 55, show hour 11. If near 05, show hour 12.
    // Simple heuristic: If start minutes > 45 and user minutes < 15, assume next hour.
    
    const startMin = questionTime.getMinutes();
    const startHour = questionTime.getHours();
    
    let derivedHour = startHour;
    
    // If we are wrapping around the hour (e.g. 11:50 -> 12:05)
    if (startMin > 40 && newMinutes < 20) {
      derivedHour = startHour + 1;
    } 
    // If we wrapped backward (user dragged back from 12:05 to 11:55)
    else if (startMin > 40 && newMinutes >= 40) {
      derivedHour = startHour;
    } 
    // Normal case (3:10 -> 3:20)
    else {
      derivedHour = startHour;
    }
    
    // Handle 12 to 1 wrap in display
    if (derivedHour > 12) derivedHour -= 12;
    
    setDisplayHour(derivedHour);
  };

  const checkAnswer = async () => {
    if (!gameActive) return;

    const targetTime = addMinutes(questionTime, targetOffset);
    const targetMin = targetTime.getMinutes();
    
    // Check if correct (exact minute match)
    const correct = userMinutes === targetMin;
    
    setIsCorrect(correct);
    setGameActive(false); // Disable interaction while showing result

    if (correct) {
      setScore(s => s + 10);
    }

    // Prepare strings for AI
    const originalTimeStr = `${questionTime.getHours()}:${questionTime.getMinutes().toString().padStart(2, '0')}`;
    const userTimeStr = `${displayHour}:${userMinutes.toString().padStart(2, '0')}`;
    
    setIsLoadingFeedback(true);
    const aiMessage = await getTeacherFeedback(
      correct, 
      originalTimeStr, 
      targetOffset, 
      userTimeStr
    );
    setFeedback(aiMessage);
    setIsLoadingFeedback(false);
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      
      {/* Header / Score */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-slate-700 text-lg">{score} Puan</span>
        </div>
        <h1 className="text-xl font-bold text-sky-600 tracking-wide">ZAMAN GEZGİNİ</h1>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md flex flex-col items-center space-y-6 relative overflow-hidden">
        
        {/* Decorative Background blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-100 rounded-full blur-2xl opacity-50 z-0"></div>

        {/* Question Area */}
        <div className="text-center z-10 w-full">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Görev</p>
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
            <p className="text-2xl font-bold text-indigo-900 mb-1">
              {questionTime.getHours()}:{questionTime.getMinutes().toString().padStart(2, '0')}
            </p>
            <p className="text-lg text-indigo-700 font-medium">
              Bu saatten <span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm text-indigo-600">{targetOffset} dakika</span> sonrasını göster.
            </p>
          </div>
        </div>

        {/* Clock UI */}
        <div className="relative z-10 py-2">
          <Clock 
            hours={displayHour} 
            minutes={userMinutes} 
            isInteractive={gameActive}
            onMinuteChange={handleMinuteChange} 
          />
          {/* Helper Text below clock */}
          <p className="text-center text-slate-400 text-sm mt-4">
             {gameActive ? "Yelkovanı (kırmızı) sürükle!" : "Cevap kontrol ediliyor..."}
          </p>
        </div>

        {/* Controls */}
        <div className="w-full z-10 flex flex-col gap-3">
          
          {gameActive ? (
            <button 
              onClick={checkAnswer}
              className="w-full py-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-lg shadow-lg shadow-sky-200 transition-all flex items-center justify-center gap-2 group"
            >
              <Check className="w-6 h-6 group-hover:scale-110 transition-transform" />
              KONTROL ET
            </button>
          ) : (
             <button 
              onClick={startNewRound}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 group ${
                isCorrect 
                  ? 'bg-green-500 hover:bg-green-600 shadow-green-200 text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 text-white'
              }`}
            >
              {isCorrect ? (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  SONRAKİ SORU
                </>
              ) : (
                 <>
                  <RefreshCw className="w-6 h-6" />
                  TEKRAR DENE
                </>
              )}
            </button>
          )}

        </div>
      </div>

      {/* AI "Monolog" / Feedback Area */}
      <div className={`mt-6 w-full max-w-md transition-all duration-500 ${isCorrect !== null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className={`relative p-4 rounded-2xl border-2 flex gap-4 items-start shadow-md bg-white ${isCorrect ? 'border-green-100' : 'border-orange-100'}`}>
           {/* Speech Bubble Triangle */}
           <div className="absolute -top-3 left-8 w-6 h-6 bg-white border-t-2 border-l-2 border-inherit transform rotate-45"></div>
           
           <div className={`p-2 rounded-full shrink-0 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              <MessageCircle className="w-6 h-6" />
           </div>
           
           <div className="flex-1">
             <h3 className="font-bold text-sm text-slate-400 uppercase mb-1">Zaman Ustası Diyor ki:</h3>
             {isLoadingFeedback ? (
               <div className="flex space-x-1 h-6 items-center">
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
               </div>
             ) : (
               <p className="text-slate-700 font-medium leading-relaxed">
                 {feedback}
               </p>
             )}
           </div>
        </div>
      </div>

    </div>
  );
};

export default App;