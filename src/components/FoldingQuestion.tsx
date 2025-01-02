import React, { useState, useEffect } from 'react';
import _ from 'lodash';

const FoldingQuestion = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const colors = ['red', 'blue', 'green', 'purple'];

  const generateRandomOffset = () => {
    // 0, 8, 16, 24 piksel offset seçenekleri
    const possibleOffsets = [0, 8, 16, 24];
    return possibleOffsets[Math.floor(Math.random() * possibleOffsets.length)];
  };

  const getStickStyles = (position, offset, isInner = false) => {
    // İç pozisyonlar için farklı offset hesapla
    const innerOffset = isInner ? offset : 24 - offset;
    
    const styles = {
      top: {
        outer: `w-2 h-16 -top-16 left-${offset}`,
        inner: `w-2 h-16 top-0 left-${innerOffset}`
      },
      bottom: {
        outer: `w-2 h-16 bottom-0 left-${offset}`,
        inner: `w-2 h-16 bottom-0 left-${innerOffset}`
      },
      left: {
        outer: `h-2 w-16 -left-16 top-${offset}`,
        inner: `h-2 w-16 left-0 top-${innerOffset}`
      },
      right: {
        outer: `h-2 w-16 right-0 top-${offset}`,
        inner: `h-2 w-16 right-0 top-${innerOffset}`
      }
    };

    return styles[position];
  };

  const generateQuestion = () => {
    // Çubuklar için pozisyonlar ve renkler
    const positions = ['top', 'right', 'bottom', 'left'];
    const colors = ['blue', 'red', 'purple', 'green'];
    
    // Her pozisyon için bir çubuk oluştur
    const sticks = positions.map((position, index) => ({
      position,
      color: colors[index],
      styles: {
        outer: getStickStyles(position, 24, false).outer,
        inner: getStickStyles(position, 16, true).inner
      }
    }));

    // Farklı soru tipleri
    const questionPatterns = [
      // Tip 1: Hepsi yarıya katlanmış
      {
        offsets: [16, 16, 16, 16],
        positions: ['top', 'right', 'bottom', 'left']
      },
      // Tip 2: Çapraz katlanmış
      {
        offsets: [24, 0, 24, 0],
        positions: ['top', 'right', 'bottom', 'left']
      },
      // Tip 3: Kademeli katlanmış
      {
        offsets: [0, 8, 16, 24],
        positions: ['top', 'right', 'bottom', 'left']
      },
      // Tip 4: Zıt köşeler
      {
        offsets: [24, 24, 0, 0],
        positions: ['top', 'right', 'bottom', 'left']
      },
      // Tip 5: Tek köşe açık
      {
        offsets: [24, 0, 0, 0],
        positions: ['top', 'right', 'bottom', 'left']
      }
    ];

    // Yanlış cevap desenleri
    const wrongPatterns = [
      // Tamamen dışarıda
      {
        offsets: [24, 24, 24, 24],
        positions: ['right', 'bottom', 'left', 'top']
      },
      // Tamamen içeride
      {
        offsets: [0, 0, 0, 0],
        positions: ['bottom', 'left', 'top', 'right']
      },
      // Karşılıklı zıt
      {
        offsets: [0, 24, 0, 24],
        positions: ['left', 'top', 'right', 'bottom']
      },
      // İki içeri iki dışarı
      {
        offsets: [24, 24, 0, 0],
        positions: ['top', 'bottom', 'left', 'right']
      },
      // Kademeli ters
      {
        offsets: [24, 16, 8, 0],
        positions: ['top', 'right', 'bottom', 'left']
      }
    ];

    // Rastgele bir soru deseni seç
    const questionIndex = Math.floor(Math.random() * questionPatterns.length);
    const correctPattern = questionPatterns[questionIndex];

    // Yanlış desenleri karıştır ve 3 tane seç
    const selectedWrongPatterns = _.shuffle(wrongPatterns)
      .filter(pattern => JSON.stringify(pattern.offsets) !== JSON.stringify(correctPattern.offsets))
      .slice(0, 3);

    // Doğru cevap için rastgele bir harf seç (A, B, C, D)
    const letters = ['A', 'B', 'C', 'D'];
    const correctAnswerLetter = letters[Math.floor(Math.random() * letters.length)];
    
    // Her seçenek için desenleri oluştur
    const options = {};
    letters.forEach((letter, index) => {
      // Eğer bu doğru cevap harfi ise, doğru deseni kullan
      if (letter === correctAnswerLetter) {
        options[letter] = sticks.map((stick, i) => ({
          color: stick.color,
          style: getStickStyles(correctPattern.positions[i], correctPattern.offsets[i], true).inner
        }));
      } else {
        // Yanlış desenlerden birini kullan
        const wrongPattern = selectedWrongPatterns[index > letters.indexOf(correctAnswerLetter) ? index - 1 : index];
        options[letter] = sticks.map((stick, i) => ({
          color: stick.color,
          style: getStickStyles(wrongPattern.positions[i], wrongPattern.offsets[i], true).inner
        }));
      }
    });

    // Debug için logla
    console.log('Soru Tipi:', questionIndex + 1);
    console.log('Seçenek Desenleri:', Object.entries(options).map(([key, value]) => {
      const pattern = {
        offsets: value.map(stick => {
          const match = stick.style.match(/(?:left|top)-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }),
        positions: value.map(stick => {
          if (stick.style.includes('left-')) return 'left';
          if (stick.style.includes('right-')) return 'right';
          if (stick.style.includes('top-')) return 'top';
          return 'bottom';
        })
      };
      return {
        harf: key,
        desen: pattern.offsets,
        pozisyonlar: pattern.positions,
        doğruMu: key === correctAnswerLetter,
        doğruDesenMi: JSON.stringify(pattern.offsets) === JSON.stringify(correctPattern.offsets)
      };
    }));

    return {
      sticks: sticks.map(stick => ({
        color: stick.color,
        style: stick.styles.outer
      })),
      options,
      correctAnswer: correctAnswerLetter
    };
  };

  const createNewQuestion = () => {
    const { sticks, correctAnswer, options } = generateQuestion();
    setCurrentQuestion({
      sticks: sticks,
      correctAnswer: correctAnswer,
      options: options
    });
    setQuestionNumber(prev => prev + 1);
    setSelectedOption(null);
    setShowResult(false);
  };

  useEffect(() => {
    createNewQuestion();
  }, []);

  useEffect(() => {
    if (selectedOption !== null && currentQuestion && selectedOption === currentQuestion.correctAnswer) {
      const timer = setTimeout(() => {
        createNewQuestion();
        setSelectedOption(null);
        setShowResult(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedOption, currentQuestion]);

  const renderSquare = (sticks) => {
    return (
      <div className="relative w-32 h-32 bg-white border-2 border-gray-800">
        {sticks.map((stick, index) => (
          <div
            key={index}
            className={`absolute ${stick.style} bg-${stick.color}-500 transform transition-all duration-300`}
          />
        ))}
      </div>
    );
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-8">
        {/* Soru Bölümü */}
        <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Çubuklar İçeri Katlandığında Nasıl Görünür?
          </h2>
          <div className="flex justify-center">
            <div className="relative transform hover:scale-105 transition-all duration-300">
              <div className="p-6 bg-white rounded-xl shadow-lg">
                {renderSquare(currentQuestion.sticks)}
              </div>
              <div className="text-center mt-6">
                <span className="inline-flex items-center px-6 py-2 rounded-full text-sm font-semibold
                  bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l4 4L19 7" />
                  </svg>
                  Başlangıç Durumu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seçenekler Bölümü */}
        <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Olası Sonuçlar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {Object.entries(currentQuestion.options).map(([letter, sticks]) => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedOption(letter);
                  setShowResult(true);
                }}
                disabled={selectedOption !== null}
                className={`
                  group relative p-6 rounded-xl transition-all duration-300
                  ${selectedOption === null ? 'hover:scale-105' : ''}
                  ${selectedOption === letter ? 'bg-indigo-100/90 border-2 border-indigo-200' : 'bg-white/90 backdrop-blur-sm border border-white/20'}
                  hover:shadow-xl hover:border-indigo-200
                `}
              >
                <div className="flex justify-center mb-2">
                  {renderSquare(sticks)}
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center
                  rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white
                  shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-sm font-bold">{letter}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sonuç ve İlerleme Bölümü */}
        <div className="w-full flex flex-col items-center space-y-6">
          {selectedOption !== null && (
            <div className={`
              w-full max-w-lg transform transition-all duration-500
              ${selectedOption === currentQuestion.correctAnswer 
                ? 'animate-bounce-once' 
                : 'animate-shake'}
            `}>
              <div className={`
                p-6 rounded-xl shadow-lg text-center backdrop-blur-sm
                ${selectedOption === currentQuestion.correctAnswer 
                  ? 'bg-emerald-100/90 border-2 border-emerald-200' 
                  : 'bg-rose-100/90 border-2 border-rose-200'}
              `}>
                <div className="flex items-center justify-center mb-2">
                  {selectedOption === currentQuestion.correctAnswer ? (
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className="text-lg font-bold mb-2">
                  {selectedOption === currentQuestion.correctAnswer 
                    ? 'Harika!' 
                    : 'Tekrar Dene!'}
                </p>
                <p className="text-sm">
                  {selectedOption === currentQuestion.correctAnswer 
                    ? 'Çubukların nasıl katlanacağını doğru tahmin ettin.' 
                    : 'Çubukların nasıl katlandığına dikkat et.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoldingQuestion;