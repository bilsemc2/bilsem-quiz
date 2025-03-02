import { useState, useEffect } from 'react';
interface Story {
  id: string;
  title: string;
  content: string;
  summary: string;
  theme: string;
  image_url: string;
  questions: Array<{
    text: string;
    options: string[];
    correctAnswer: number;
    feedback: {
      correct: string;
      incorrect: string;
    }
  }>;
}
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { decode } from 'html-entities';

type GameType = 'scramble' | 'fill' | 'order';

interface WordGamesProps {
  story: Story;
}

export function WordGames({ story }: WordGamesProps) {
  // Oyun tipi, sorular oluşturulurken kullanılıyor
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState<Array<{
    type: GameType;
    question: string;
    answer: string;
    scrambled?: string;
    options?: string[];
  }>>([]);

  useEffect(() => {
    const content = decode(story.content);
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    
    const gameQuestions = sentences.slice(0, 6).map((sentence, index) => {
      const cleanSentence = sentence.trim();
      const words = cleanSentence.split(' ');
      
      if (index % 3 === 0) {
        // Kelime karıştırma oyunu
        const word = words[Math.floor(Math.random() * words.length)]
          .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
        return {
          type: 'scramble' as GameType,
          question: `Bu kelimeyi düzelt: ${shuffleWord(word)}`,
          answer: word,
          scrambled: shuffleWord(word)
        };
      } else if (index % 3 === 1) {
        // Boşluk doldurma oyunu
        const wordToRemove = words[Math.floor(Math.random() * words.length)]
          .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
        return {
          type: 'fill' as GameType,
          question: cleanSentence.replace(wordToRemove, '_____'),
          answer: wordToRemove,
          options: generateOptions(wordToRemove, words)
        };
      } else {
        // Cümle sıralama oyunu
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        return {
          type: 'order' as GameType,
          question: 'Bu cümleyi doğru sıraya koy:\n' + shuffledWords.join(' '),
          answer: cleanSentence
        };
      }
    });

    setQuestions(gameQuestions);
  }, [story]);

  function shuffleWord(word: string): string {
    return word.split('').sort(() => Math.random() - 0.5).join('');
  }

  function generateOptions(answer: string, words: string[]): string[] {
    const options = [answer];
    const filteredWords = words
      .map(w => w.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, ''))
      .filter(w => w.length > 2 && w !== answer);
    
    while (options.length < 4 && filteredWords.length > 0) {
      const randomWord = filteredWords.splice(
        Math.floor(Math.random() * filteredWords.length),
        1
      )[0];
      if (!options.includes(randomWord)) {
        options.push(randomWord);
      }
    }

    return options.sort(() => Math.random() - 0.5);
  }

  const handleSubmit = () => {
    const currentQ = questions[currentQuestion];
    const isCorrect = userAnswer.toLowerCase() === currentQ.answer.toLowerCase();
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowFeedback(true);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setUserAnswer('');
        setShowFeedback(false);
      }
    }, 2000);
  };

  const currentQ = questions[currentQuestion];

  if (!currentQ) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-purple-900">
            Kelime Oyunları
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium">
              Puan: {score}/{questions.length}
            </span>
            <span className="text-sm text-gray-500">
              Soru {currentQuestion + 1}/{questions.length}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-lg font-medium text-purple-900">
              {currentQ.question}
            </p>
          </div>

          {currentQ.type === 'fill' && currentQ.options && (
            <div className="grid grid-cols-2 gap-3">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setUserAnswer(option)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    userAnswer === option
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {(currentQ.type === 'scramble' || currentQ.type === 'order') && (
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Cevabınızı yazın..."
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          )}

          {showFeedback ? (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              userAnswer.toLowerCase() === currentQ.answer.toLowerCase()
                ? 'bg-green-100'
                : 'bg-red-100'
            }`}>
              {userAnswer.toLowerCase() === currentQ.answer.toLowerCase() ? (
                <>
                  <CheckCircle2 className="text-green-600" />
                  <span className="font-medium text-green-800">
                    Harika! Doğru cevap!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="text-red-600" />
                  <span className="font-medium text-red-800">
                    Doğru cevap: {currentQ.answer}
                  </span>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Cevabı Kontrol Et
            </button>
          )}
        </div>

        {currentQuestion === questions.length - 1 && showFeedback && (
          <div className="mt-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-purple-900 mb-4">
              Oyun Bitti! 🎉
              </h3>
              <p className="text-lg mb-4">
              {questions.length} sorudan {score} tanesini doğru bildin!
              </p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-500"
                  style={{ width: `${(score / questions.length) * 100}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                setCurrentQuestion(0);
                setScore(0);
                setShowFeedback(false);
                setUserAnswer('');
              }} 
              className="flex items-center gap-2 mx-auto mt-8 px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw size={20} />
              <span>Tekrar Oyna</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}