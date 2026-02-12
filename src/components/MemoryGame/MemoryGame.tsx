import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import './MemoryGame.css';
import { soundManager } from './sounds';

// Kart arayüzü
interface Card {
  id: number;
  imageUrl: string;
  flipped: boolean;
  matched: boolean;
}

// Kart çifti kontrolü için bir type
type CardPair = {
  first: Card | null;
  second: Card | null;
};

const MemoryGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousState = location.state?.previousState;

  // Durum değişkenleri
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedPair, setFlippedPair] = useState<CardPair>({ first: null, second: null });
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false); // Kart kontrolü sırasında tıklamaları engelleme

  // Kullanılabilir resimleri yükle
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Resimleri 'public/images/memory' klasöründen getir
        const response = await fetch('/api/memory-images');
        if (!response.ok) {
          toast.error('Resim listesi alınamadı', {
            duration: 3000,
            position: 'top-center',
            style: {
              border: '1px solid #E57373',
              padding: '16px',
              color: '#D32F2F',
            },
          });
          throw new Error('Resim listesi alınamadı');
        }

        // Burada API yanıtını bekleriz, ancak şu an statik liste kullanıyoruz
        // const data = await response.json();
        // Burada gerçek bir API olmadığı için statik bir liste kullanıyoruz
        // Gerçek uygulamada bu veriyi API'den alacaksınız
        const imageList = [
          'gs.webp', 'gs2.webp', 'gs3.webp',
          'hp.webp', 'hp2.webp', 'hp3.webp',
          'ir.webp', 'ir2.webp', 'ir4.webp',
          'spd.webp', 'spd2.webp', 'spd4.webp',
          'tho.webp', 'thor2.webp', 'thor3.webp',
          'unicorn.webp', 'unicorn2.webp', 'unicorn3.webp',
          'bjk1.webp', 'bjk2.webp', 'bjk3.webp', 'bjk4.webp',
          'fnr3.webp', 'fnr4.webp', 'fnr5.webp', 'bjk4.webp',
          'mess1.webp', 'mess2.webp', 'mess3.webp', 'mess4.webp',
          'msss2.webp', 'mssspr.webp', 'mssss.webp', 'rbbt.webp',
        ];

        setAvailableImages(imageList);
        setLoading(false);
      } catch (error) {
        console.error('Resimler yüklenirken hata:', error);
        toast.error('Resimler yüklenirken bir sorun oluştu. Varsayılan resimler kullanılacak.', {
          duration: 4000,
          position: 'top-center',
          style: {
            border: '1px solid #E57373',
            padding: '16px',
            color: '#D32F2F',
          },
        });
        // Hata durumunda bile bazı statik resimler kullanarak oyunun çalışmasını sağla
        setAvailableImages([
          'gs.webp', 'gs2.webp', 'gs3.webp',
          'hp.webp', 'hp2.webp', 'hp3.webp',
          'ir.webp', 'ir2.webp', 'ir4.webp'
        ]);
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  // Oyunu başlat
  const startGame = useCallback(() => {
      window.scrollTo(0, 0);
    if (availableImages.length === 0) {
      toast.error('Oyun başlatılamıyor, resimler yüklenemedi!', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    // 4x4 düzen için 8 çift kart (toplam 16 kart)
    const numberOfPairs = 8;

    // Kullanılabilir resimlerden rastgele seç
    const shuffledImages = [...availableImages].sort(() => 0.5 - Math.random());
    const selectedImages = shuffledImages.slice(0, numberOfPairs);

    // Her resimden 2 adet olacak şekilde kart dizisini oluştur
    let newCards: Card[] = [];
    selectedImages.forEach((image, index) => {
      // İlk kart
      newCards.push({
        id: index * 2,
        imageUrl: `/images/memory/${image}`,
        flipped: false,
        matched: false
      });

      // Eşleşen ikinci kart
      newCards.push({
        id: index * 2 + 1,
        imageUrl: `/images/memory/${image}`,
        flipped: false,
        matched: false
      });
    });

    // 4x4 için merkez karta gerek yok

    // Kartları karıştır
    newCards = newCards.sort(() => 0.5 - Math.random());

    // Oyun durumunu sıfırla
    setCards(newCards);
    setFlippedPair({ first: null, second: null });
    setMoves(0);
    setMatchedPairs(0);
    setGameOver(false);
    setGameStarted(true);
  }, [availableImages]);

  // Kart çevirme işlemi
  const flipCard = (selectedCard: Card) => {
    // Eğer oyun bitti veya işlem yapılıyorsa tıklamaları engelle
    if (gameOver || isProcessing) {
      toast.error('Lütfen bekleyin!', {
        duration: 1000,
        position: 'top-center'
      });
      return;
    }

    // Eğer kart zaten çevrilmiş veya eşleştirilmişse, hiçbir şey yapma
    if (selectedCard.flipped || selectedCard.matched) return;

    // Eğer iki kart zaten çevriliyse, başka kart çeviremez
    if (flippedPair.first && flippedPair.second) {
      toast.error('Lütfen bekleyin!', {
        duration: 1000,
        position: 'top-center'
      });
      return;
    }

    // Ses efekti
    soundManager.play('flip');

    // Seçilen kartı çevir
    const updatedCards = cards.map(card =>
      card.id === selectedCard.id ? { ...card, flipped: true } : card
    );

    // Çevrilen ilk veya ikinci kart
    if (!flippedPair.first) {
      setFlippedPair({ first: selectedCard, second: null });
    } else {
      setFlippedPair({ ...flippedPair, second: selectedCard });
      setMoves(prevMoves => prevMoves + 1);

      // İşlem devam ettiğini işaretle
      setIsProcessing(true);

      // Hamle sayısını artır
      setTimeout(() => {
        checkForMatch(selectedCard);
      }, 1000);
    }

    setCards(updatedCards);
  };

  // Eşleşme kontrolü
  const checkForMatch = (secondCard: Card) => {
    if (!flippedPair.first) return;

    const isMatch = flippedPair.first.imageUrl === secondCard.imageUrl;

    if (isMatch) {
      // Ses efekti
      soundManager.play('match');

      // Eşleşme bildirimi göster
      toast.success('Eşleşme bulundu!', {
        duration: 1500,
        position: 'top-center',
        icon: '🎉',
        style: {
          border: '1px solid #81C784',
          padding: '16px',
          color: '#2E7D32',
        },
      });

      // Eşleşen kartları güncelle - hem çevrilmiş hem de eşleşmiş olarak işaretle
      const updatedCards = cards.map(card =>
        card.id === flippedPair.first?.id || card.id === secondCard.id
          ? { ...card, flipped: true, matched: true }
          : card
      );

      setCards(updatedCards);
      setMatchedPairs(prev => prev + 1);

      // Yeni eşleşme sayısını hesapla
      const newMatchedPairs = matchedPairs + 1;

      // 4x4 düzen için gereken eşleşme sayısı 8
      if (newMatchedPairs === cards.length / 2) {
        // Son bir kontrol daha yap - tüm kartların gerçekten eşleşip eşleşmediğine bak
        const allMatched = updatedCards.every(card => card.matched);

        if (allMatched) {
          // Oyun bitişi ses efekti
          soundManager.play('win');

          // Oyun tamamlandı bildirimi
          toast.success('Tebrikler! Oyunu tamamladınız!', {
            duration: 5000,
            position: 'top-center',
            icon: '🏆',
            style: {
              border: '1px solid #FFCA28',
              padding: '16px',
              color: '#F57F17',
              fontWeight: 'bold',
            },
          });

          setGameOver(true);
        }
      }
    } else {
      // Eşleşmiyorsa kartları geri çevir
      toast.error('Eşleşme bulunamadı!', {
        duration: 1000,
        position: 'top-center',
        style: {
          border: '1px solid #E57373',
          padding: '8px',
          color: '#D32F2F',
        },
      });

      setTimeout(() => {
        const updatedCards = cards.map(card =>
          // Sadece bu hamledeki çevrilmiş ama eşleşmemiş kartları geri çevir
          (card.id === flippedPair.first?.id || card.id === secondCard.id) && !card.matched
            ? { ...card, flipped: false }
            : card
        );

        setCards(updatedCards);
        setIsProcessing(false); // İşlem tamamlandı
      }, 1000);
    }

    // Her durumda çevrilen kart çiftini sıfırla
    setFlippedPair({ first: null, second: null });
    setIsProcessing(false); // İşlem tamamlandı
  };

  // Oyunu yeniden başlat
  const restartGame = () => {
    toast.success('Oyun yeniden başlatılıyor...', {
      duration: 2000,
      position: 'top-center',
      icon: '🔄',
    });
    startGame();
  };

  // Sonuçlar sayfasına dön
  const returnToResults = () => {
    const quizId = location.state?.quizId || previousState?.quizId;
    const quizResultPath = quizId ? `/quiz/${quizId}/results` : '/quiz/results';

    toast('Sonuçlar sayfasına dönülüyor...', {
      duration: 2000,
      position: 'top-center',
      icon: '↩️',
    });

    navigate(quizResultPath, {
      state: {
        ...previousState,
        memoryGameScore: {
          moves,
          pairs: matchedPairs,
          completed: gameOver
        },
        fromMemoryGame: true
      },
      replace: true
    });
  };

  // Oyun yüklenirken göster
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Oyun yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Oyunu başlatmadıysa göster
  if (!gameStarted) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Hafıza Kartı Oyununa Hoş Geldiniz!</h1>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="mb-6 text-gray-600">
            Eşleşen kartları bulmaya çalış! Tüm çiftleri en az hamlede eşleştirmeye çalış.
          </p>
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg shadow transition-colors"
          >
            Oyunu Başlat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Oyun bilgileri */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Hafıza Kartı Oyunu</h1>
            <p className="text-gray-600">Eşleşen kartları bul!</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-center">
              <p className="text-sm text-gray-500">Hamleler</p>
              <p className="text-2xl font-bold text-indigo-600">{moves}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Eşleşmeler</p>
              <p className="text-2xl font-bold text-green-600">{matchedPairs} / {cards.length / 2}</p>
            </div>
          </div>
        </div>

        {/* Kart ızgarası */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-2">
            {cards.map(card => (
              <div
                key={card.id}
                onClick={() => !gameOver && flipCard(card)}
                className={`relative aspect-square rounded-md shadow-sm cursor-pointer transition-transform duration-300 transform ${card.flipped ? 'rotate-y-180' : ''} ${card.matched ? 'opacity-70' : ''}`}
              >
                {/* Ön yüz (kapalı hali) */}
                <div className={`absolute w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-md flex items-center justify-center ${card.flipped || card.matched ? 'hidden' : 'block'}`}>
                  <span className="text-white text-2xl">?</span>
                </div>

                {/* Arka yüz (açık hali) */}
                <div className={`absolute w-full h-full rounded-md overflow-hidden ${card.flipped || card.matched ? 'block' : 'hidden'}`}>
                  <img
                    src={card.imageUrl}
                    alt="Memory Card"
                    className="w-full h-full object-contain rounded-md p-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/card-back.png'; // Kart arka yüzü değiştirildi
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Oyun Sonu */}
        {gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Tebrikler!</h2>
              <p className="text-gray-600 mb-6">
                Tüm kartları {moves} hamlede eşleştirdin.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={restartGame}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded shadow transition-colors"
                >
                  Tekrar Oyna
                </button>
                <button
                  onClick={returnToResults}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded shadow transition-colors"
                >
                  Sonuçlara Dön
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;
