import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FallingNumbersGame.css';

/*---------------------------------
 |  SABİTLER ve TİPLER
 *--------------------------------*/
const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;

const BASKET_WIDTH = 80;
const BASKET_HEIGHT = 50;
const DIGIT_SIZE = 40;

// Piksel / saniye cinsinden hızlar
const SPEED = {
  FALL: 200,       // Düşme hızı
  HORIZONTAL: 100  // Rakamın yatay hareket hızı
};

interface Digit {
  id: number;
  x: number;
  y: number;
  value: number;
  isCorrect: boolean;
  startTime: number;  // Düşmeye başlama zamanı
}

/*---------------------------------
 |  BİLEŞEN
 *--------------------------------*/
const FallingNumbersGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousState = location.state?.previousState;

  /*---------------------------------
   |  STATE
   *--------------------------------*/
  // Rastgele sepet numarası (1-9)
  const [basketNumber, setBasketNumber] = useState(() => {
    return Math.floor(Math.random() * 9) + 1; // 1-9 arası
  });

  // Rastgele "targetNumber" (basketNumber * [1-10])
  const [targetNumber, setTargetNumber] = useState(() => {
    const multiplier = Math.floor(Math.random() * 10) + 1;
    return basketNumber * multiplier;
  });

  // Doğru digit -> targetNumber / basketNumber
  const correctNumber = useMemo(
    () => targetNumber / basketNumber,
    [targetNumber, basketNumber]
  );

  // Sepet'in x konumu
  const [basketX, setBasketX] = useState(
    GAME_WIDTH / 2 - BASKET_WIDTH / 2
  );

  // Ekrandaki düşen rakamlar
  const [digits, setDigits] = useState<Digit[]>([]);

  // Oyun sonu / mesaj
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');

  // Animasyon için
  const previousTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /*---------------------------------
   |  YARDIMCI FONK. & CALLBACKLER
   *--------------------------------*/

  // Yeni Digit'leri üretme
  const spawnDigits = useCallback(() => {
    const now = Date.now();
    const delay = 1000; // Her top arasında 1 saniye bekle

    // 1) Doğru Digit
    const correctDigit: Digit = {
      id: now,
      x: Math.floor(Math.random() * (GAME_WIDTH - DIGIT_SIZE)),
      y: -DIGIT_SIZE, // Ekranın üstünde başla
      value: Math.floor(correctNumber),
      isCorrect: true,
      startTime: now + Math.floor(Math.random() * 6) * delay // 0-5 sn arası rastgele başla
    };

    // 2) Yanlış Digit
    const wrongValues: number[] = [];
    while (wrongValues.length < 5) {
      const rand = Math.floor(Math.random() * 10) + 1;
      if (rand !== correctNumber && !wrongValues.includes(rand)) {
        wrongValues.push(rand);
      }
    }

    const wrongDigits: Digit[] = wrongValues.map((val, idx) => ({
      id: now + idx + 1,
      x: Math.floor(Math.random() * (GAME_WIDTH - DIGIT_SIZE)),
      y: -DIGIT_SIZE, // Ekranın üstünde başla
      value: val,
      isCorrect: false,
      startTime: now + Math.floor(Math.random() * 6) * delay // 0-5 sn arası rastgele başla
    }));

    // 3) Karıştır
    const allDigits = [correctDigit, ...wrongDigits];
    for (let i = allDigits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allDigits[i], allDigits[j]] = [allDigits[j], allDigits[i]];
    }

    setDigits(allDigits);
  }, [correctNumber]);

  // Sepet ile çarpışma testi
  const checkBasketCollision = (
    digit: Digit,
    basketX: number,
    basketY: number
  ): boolean => {
    const digitRight = digit.x + DIGIT_SIZE;
    const digitBottom = digit.y + DIGIT_SIZE;
    const basketRight = basketX + BASKET_WIDTH;
    const basketBottom = basketY + BASKET_HEIGHT;

    return !(
      digitRight < basketX ||
      digit.x > basketRight ||
      digitBottom < basketY ||
      digit.y > basketBottom
    );
  };

  // Oyunun asıl animasyon döngüsü
  const updateGame = useCallback(
    (timestamp: number) => {
      if (gameOver) return;

      // Delta time hesapla
      if (!previousTimeRef.current) {
        previousTimeRef.current = timestamp;
      }
      const delta = timestamp - previousTimeRef.current; // ms
      previousTimeRef.current = timestamp;

      const now = Date.now();

      // Digit'leri güncelle
      setDigits((prev) =>
        prev
          .map((digit) => {
            // Henüz düşme zamanı gelmediyse bekle
            if (now < digit.startTime) {
              return digit;
            }

            // Dikey hareket: fall speed px/s => px/ms = FALL / 1000
            const dy = (SPEED.FALL / 1000) * delta;
            const newY = digit.y + dy;

            return { ...digit, y: newY };
          })
          .filter((digit) => {
            // Henüz düşme zamanı gelmediyse tut
            if (now < digit.startTime) {
              return true;
            }

            // Sepet çarpışma?
            const collided = checkBasketCollision(
              digit,
              basketX,
              GAME_HEIGHT - BASKET_HEIGHT
            );
            if (collided) {
              if (digit.isCorrect) {
                setMessage('Kazandınız! Doğru sayıyı buldunuz!');
                setGameOver(true);
                // 2 saniye sonra sonuç sayfasına dön
                setTimeout(() => {
                  navigate('/result', {
                    state: previousState,
                    replace: true
                  });
                }, 2000);
              } else {
                setMessage('Kaybettiniz! Yanlış sayıya çarptınız.');
                setGameOver(true);
              }
              return false;
            }
            // Ekranı terk etti mi?
            return digit.y < GAME_HEIGHT;
          })
      );

      animationFrameRef.current = requestAnimationFrame(updateGame);
    },
    [basketX, gameOver, navigate, previousState]
  );

  /*---------------------------------
   |  EFFECTS
   *--------------------------------*/
  // Animasyon döngüsünü başlat/iptal et
  useEffect(() => {
    if (!gameOver) {
      // Başlat
      animationFrameRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameOver, updateGame]);

  // Digit listesi boşsa yeni digit'ler üret
  useEffect(() => {
    if (!gameOver && digits.length === 0) {
      spawnDigits();
    }
  }, [gameOver, digits.length, spawnDigits]);

  // Klavye ile sepeti kontrol et
  useEffect(() => {
    let moveInterval: number | null = null;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (moveInterval) return; // Zaten hareket ediyorsa çık

      const step = 40; // İlk hareket için 40px
      if (e.key === 'ArrowLeft') {
        setBasketX((prev) => Math.max(prev - step, 0));
        // Sürekli hareket başlat
        moveInterval = window.setInterval(() => {
          setBasketX((prev) => Math.max(prev - step/2, 0));
        }, 16);
      } else if (e.key === 'ArrowRight') {
        setBasketX((prev) => Math.min(prev + step, GAME_WIDTH - BASKET_WIDTH));
        // Sürekli hareket başlat
        moveInterval = window.setInterval(() => {
          setBasketX((prev) => Math.min(prev + step/2, GAME_WIDTH - BASKET_WIDTH));
        }, 16);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (moveInterval) {
          clearInterval(moveInterval);
          moveInterval = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (moveInterval) {
        clearInterval(moveInterval);
      }
    };
  }, []);

  /*---------------------------------
   |  YENİDEN BAŞLATMA
   *--------------------------------*/
  const handleRestart = () => {
    const newBasket = Math.floor(Math.random() * 9) + 1; // 1-9 arası
    setBasketNumber(newBasket);

    const newMultiplier = Math.floor(Math.random() * 10) + 1;
    setTargetNumber(newBasket * newMultiplier);

    setDigits([]);
    setMessage('');
    setGameOver(false);
    previousTimeRef.current = null;
  };

  /*---------------------------------
   |  RENDER
   *--------------------------------*/
  return (
    <div className="game-wrapper">
      {/* Sol Panel */}
      <div className="sidebar">
        <h2>Hedef Sayı: {targetNumber}</h2>
        <p>
          İpucu: Sepetteki sayı ile çarpılınca {targetNumber} veren sayıyı yakala!
        </p>
        <p>Dikkat: Yanlış sayıya değersen kaybedersin!</p>

        {gameOver && (
          <>
            <p className="msg-result">{message}</p>
            <button onClick={handleRestart}>Yeniden Başla</button>
          </>
        )}
      </div>

      {/* Oyun Alanı */}
      <div
        className="game-area"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Düşen rakamlar */}
        {digits.map((digit) => (
          <div
            key={digit.id}
            className={`digit ${digit.isCorrect ? 'correct' : 'wrong'}`}
            style={{
              left: digit.x,
              top: digit.y
            }}
          >
            {String(digit.value)}
          </div>
        ))}

        {/* Sepet */}
        <div
          className="basket"
          style={{
            left: basketX,
            bottom: 0,
            width: BASKET_WIDTH,
            height: BASKET_HEIGHT
          }}
        >
          {basketNumber}
        </div>
      </div>
    </div>
  );
};

export default FallingNumbersGame;