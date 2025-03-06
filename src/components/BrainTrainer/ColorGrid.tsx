import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import './ColorGrid.css';

// Renk seçenekleri
const COLORS = ['red', 'blue', 'yellow', 'green'];
// Renk isimlerinin Türkçe karşılıkları - ileride toast mesajlarında kullanılabilir
const COLOR_NAMES_TR: Record<string, string> = {
  red: 'Kırmızı',
  blue: 'Mavi',
  yellow: 'Sarı',
  green: 'Yeşil'
};

// Seviye başına gösterilecek renk sayısı
const LEVEL_COLORS = {
  1: 2, // 1. seviye: 2 renk
  2: 3, // 2. seviye: 3 renk
  3: 4, // 3. seviye: 4 renk
  4: 5, // 4. seviye: 5 renk
  5: 6  // 5. seviye: 6 renk
};

// Hücre arayüzü
interface Cell {
  id: number;
  color: string | null;
  active: boolean;
}

// Oyun durumu için tip
interface GameState {
  level: number;
  sequence: Array<{cellId: number, color: string}>;
  userSequence: Array<{cellId: number, color: string}>;
  isShowingSequence: boolean;
  gameOver: boolean;
  gameStarted: boolean;
  isUserTurn: boolean;
}

const ColorGrid: React.FC = () => {
  // Izgara hücreleri
  const [cells, setCells] = useState<Cell[]>(
    Array(9).fill(null).map((_, index) => ({
      id: index,
      color: null,
      active: false
    }))
  );
  
  // Oyun durumu
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    sequence: [],
    userSequence: [],
    isShowingSequence: false,
    gameOver: false,
    gameStarted: false,
    isUserTurn: false
  });

  // Kullanıcı ilerlemesi
  const [score, setScore] = useState(0);
  
  // Oyunu başlat
  const startGame = useCallback(() => {
    setGameState({
      level: 1,
      sequence: [],
      userSequence: [],
      isShowingSequence: false,
      gameOver: false,
      gameStarted: true,
      isUserTurn: false
    });
    
    // Hücreleri sıfırla
    setCells(
      Array(9).fill(null).map((_, index) => ({
        id: index,
        color: null,
        active: false
      }))
    );
    
    setScore(0);
    
    // İlk seviye için sekans oluştur
    setTimeout(() => {
      generateSequence(1);
    }, 1000);
    
    toast.success('Oyun başladı! Renk sırasını takip edin.', {
      duration: 3000,
      position: 'top-center',
    });
  }, []);
  
  // Belirli bir seviye için yeni bir renk sekansı oluştur
  const generateSequence = useCallback((level: number) => {
    const numberOfColors = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || 2;
    const newSequence: Array<{cellId: number, color: string}> = [];
    
    // Seviyeye göre renk sayısı kadar rastgele renk ve hücre seç
    for (let i = 0; i < numberOfColors; i++) {
      const randomCellId = Math.floor(Math.random() * 9);
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      
      newSequence.push({
        cellId: randomCellId,
        color: randomColor
      });
    }
    
    setGameState(prev => ({
      ...prev,
      level,
      sequence: newSequence,
      userSequence: [],
      isShowingSequence: true,
      isUserTurn: false
    }));
    
    // Sekansı göstermeye başla
    showSequence(newSequence);
  }, []);
  
  // Renk sekansını kullanıcıya göster
  const showSequence = async (sequence: Array<{cellId: number, color: string}>) => {
    // Toast ile kullanıcıyı bilgilendir
    toast.success(`${sequence.length} renk gösterilecek! Dikkatle izleyin.`, {
      duration: 2000,
      position: 'top-center',
    });
    
    // Her renk arasında bekleme süresi
    const delayBetweenColors = 500; // milisaniye
    // Her rengin gösterilme süresi
    const colorDisplayTime = 3000; // 3 saniye
    
    // Sekans başlamadan önce kısa bir bekleme
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Sekansı göster
    for (let i = 0; i < sequence.length; i++) {
      const { cellId, color } = sequence[i];
      
      // Rengi aktif et
      setCells(prevCells => 
        prevCells.map(cell => 
          cell.id === cellId ? { ...cell, color, active: true } : cell
        )
      );
      
      // Rengi belirli bir süre göster
      await new Promise(resolve => setTimeout(resolve, colorDisplayTime));
      
      // Rengi deaktif et
      setCells(prevCells => 
        prevCells.map(cell => 
          cell.id === cellId ? { ...cell, color: null, active: false } : cell
        )
      );
      
      // Sonraki renge geçmeden önce kısa bir bekleme
      if (i < sequence.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenColors));
      }
    }
    
    // Sekans bittiğinde kullanıcı sırası
    setGameState(prev => ({
      ...prev,
      isShowingSequence: false,
      isUserTurn: true
    }));
    
    toast.success(`Şimdi sizin sıranız! Gördüğünüz ${sequence.length} rengin sırasını tekrar edin.`, {
      duration: 3000,
      position: 'top-center',
    });
  };
  
  // Kullanıcı hücreye tıkladığında
  const handleCellClick = (cellId: number) => {
    // Sekans gösteriliyorsa veya kullanıcı sırası değilse tıklamaları engelle
    if (gameState.isShowingSequence || !gameState.isUserTurn || gameState.gameOver) {
      toast.error('Şu an tıklayamazsınız!', {
        duration: 1000,
        position: 'top-center',
      });
      return;
    }
    
    // Tıklanan hücre için doğru rengi belirle (o anki beklenen renk)
    const currentStep = gameState.userSequence.length;
    const expectedColor = gameState.sequence[currentStep]?.color || '';
    
    // Kullanıcı doğru hücreyi seçti mi kontrol et
    const expectedCellId = gameState.sequence[currentStep]?.cellId;
    
    if (cellId !== expectedCellId) {
      // Yanlış hücre - oyunu bitir
      toast.error(`Yanlış hücre! Beklenen renk: ${COLOR_NAMES_TR[expectedColor] || expectedColor}. Oyun bitti.`, {
        duration: 3000,
        position: 'top-center',
      });
      
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        isUserTurn: false
      }));
      return;
    }
    
    // Hücreyi kısa süreliğine aktif et
    setCells(prevCells => 
      prevCells.map(cell => 
        cell.id === cellId ? { ...cell, color: expectedColor, active: true } : cell
      )
    );
    
    // Kullanıcının seçimini kaydet
    const newUserSequence = [...gameState.userSequence, { cellId, color: expectedColor }];
    setGameState(prev => ({
      ...prev,
      userSequence: newUserSequence
    }));
    
    // 500ms sonra hücreyi deaktif et
    setTimeout(() => {
      setCells(prevCells => 
        prevCells.map(cell => 
          cell.id === cellId ? { ...cell, color: null, active: false } : cell
        )
      );
      
      // Kullanıcı tüm sekansı tamamladı mı kontrol et
      if (newUserSequence.length === gameState.sequence.length) {
        // Tüm sekans doğru mu kontrol et
        const isSequenceCorrect = newUserSequence.every((item, index) => 
          item.cellId === gameState.sequence[index].cellId
        );
        
        if (isSequenceCorrect) {
          // Skor artır
          setScore(prev => prev + gameState.level * 10);
          
          // Tüm seviyeler tamamlandı mı kontrol et
          if (gameState.level === 5) {
            // Oyun tamamlandı
            toast.success('Tebrikler! Tüm seviyeleri tamamladınız! 🎉', {
              duration: 5000,
              position: 'top-center',
            });
            
            setGameState(prev => ({
              ...prev,
              gameOver: true,
              isUserTurn: false
            }));
          } else {
            // Sonraki seviyeye geç
            toast.success(`Tebrikler! ${gameState.level}. seviyeyi tamamladınız! 🎉`, {
              duration: 3000,
              position: 'top-center',
            });
            
            // Kısa bir bekleme sonrası yeni seviyeye geç
            setTimeout(() => {
              generateSequence(gameState.level + 1);
            }, 2000);
          }
        } else {
          // Yanlış sıra - oyunu bitir
          toast.error(`Yanlış sıra! Oyun bitti.`, {
            duration: 3000,
            position: 'top-center',
          });
          
          setGameState(prev => ({
            ...prev,
            gameOver: true,
            isUserTurn: false
          }));
        }
      }
    }, 500);
  };
  
  // Kullanıcı arayüzünü render et
  return (
    <div className="color-grid-container">
      <h1>Beyin Antrenörü - Renk Sekansı</h1>
      
      <div className="game-info">
        <p>Seviye: {gameState.level}/5</p>
        <p>Skor: {score}</p>
      </div>
      
      <div className="grid-3x3">
        {cells.map(cell => (
          <div
            key={cell.id}
            className={`cell ${cell.active ? 'active' : ''}`}
            style={{ backgroundColor: cell.active && cell.color ? cell.color : 'white' }}
            onClick={() => handleCellClick(cell.id)}
          />
        ))}
      </div>
      
      <div className="game-controls">
        {!gameState.gameStarted || gameState.gameOver ? (
          <button onClick={startGame} className="start-button">
            {gameState.gameOver ? 'Yeniden Başlat' : 'Oyunu Başlat'}
          </button>
        ) : (
          <div className="game-status">
            {gameState.isShowingSequence
              ? 'Renk sırasını izleyin...'
              : gameState.isUserTurn
                ? 'Sırayı tekrar edin!'
                : 'Hazırlanıyor...'}
          </div>
        )}
      </div>
      
      <div className="game-instructions">
        <h3>Nasıl Oynanır?</h3>
        <p>
          1. Izgarada belirli hücrelerde renkler yanıp sönecek.<br />
          2. Renklerin sırasını ve yerini hafızanızda tutun.<br />
          3. Tüm renkler gösterildikten sonra aynı sırayla ve aynı hücrelere tıklayın.<br />
          4. Her seviyede daha fazla renk gösterilecek.<br />
          5. Tüm 5 seviyeyi tamamlamaya çalışın!
        </p>
      </div>
    </div>
  );
};

export default ColorGrid;