import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ColorPerception.css';

// Renk sabitleri
const COLORS = {
  kırmızı: '#FF5252',
  mavi: '#4285F4',
  sarı: '#FFC107',
  yeşil: '#0F9D58'
};

// Seviyeye göre yanıp sönme süreleri (saniye)
const LEVEL_DURATIONS = {
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1
};



interface GameState {
  level: number;
  currentColors: string[];
  isUserTurn: boolean;
  userSelections: string[];
  gameOver: boolean;
  showingColors: boolean;
}

const ColorPerception: React.FC = () => {
  // Oyun durumu
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    currentColors: [],
    isUserTurn: false,
    userSelections: [],
    gameOver: false,
    showingColors: false
  });

  // Skor
  const [score, setScore] = useState<number>(0);
  
  // Oyun başladı mı?
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  


  // Renk seçenekleri bileşeni
  const ColorOptions = () => {
    // Her render'da renkleri karıştır
    const shuffledColors = [...Object.entries(COLORS)].sort(() => 0.5 - Math.random());
    
    return (
      <div className={`color-options ${gameState.isUserTurn ? 'visible' : 'hidden'}`}>
        {shuffledColors.map(([colorName, colorCode]) => (
          <button
            key={colorName}
            className="color-option"
            style={{ backgroundColor: colorCode }}
            onClick={() => handleColorSelect(colorName)}
            disabled={!gameState.isUserTurn || gameState.gameOver}
          >
            {colorName}
          </button>
        ))}
      </div>
    );
  };

  // Hücreleri göster
  const renderCell = () => (
    <div 
      className={`perception-cell ${gameState.showingColors ? "active" : ""}`}
      style={{ 
        backgroundColor: gameState.showingColors && gameState.currentColors.length > 0 
          ? 'white' 
          : 'white' 
      }}
    >
      {gameState.showingColors && renderCellContent()}
    </div>
  );

  // Hücre içeriği
  const renderCellContent = () => {
    if (gameState.currentColors.length === 2) {
      return (
        <div className="color-split">
          <div className="color-half" style={{ backgroundColor: COLORS[gameState.currentColors[0] as keyof typeof COLORS] }}></div>
          <div className="color-half" style={{ backgroundColor: COLORS[gameState.currentColors[1] as keyof typeof COLORS] }}></div>
        </div>
      );
    }
    return null;
  };

  // Rastgele renkler oluştur
  const generateColors = useCallback((level: number) => {
    // Tüm renklerin listesini oluştur
    const colorNames = Object.keys(COLORS);
    
    // Rastgele iki renk seç
    const shuffled = [...colorNames].sort(() => 0.5 - Math.random());
    const selectedColors = shuffled.slice(0, 2);
    
    // Oyun durumunu güncelle
    setGameState(prev => ({
      ...prev,
      level,
      currentColors: selectedColors,
      isUserTurn: false,
      userSelections: [],
      showingColors: true
    }));
    
    // Belirli süre sonra renkleri gizle ve kullanıcı turuna geç
    const duration = LEVEL_DURATIONS[level as keyof typeof LEVEL_DURATIONS] * 1000;
    
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        showingColors: false,
        isUserTurn: true
      }));
      
      toast.success(`Şimdi hangi renkleri gördüğünüzü seçin`, {
        duration: 3000,
        icon: '👁️',
      });
    }, duration);
    
  }, []);

  // Renk seçimini işle
  const handleColorSelect = (colorName: string) => {
    if (!gameState.isUserTurn || gameState.gameOver) return;
    
    // Kullanıcı seçimini ekle
    setGameState(prev => {
      const newUserSelections = [...prev.userSelections, colorName];
      
      // İki renk de seçildi mi?
      if (newUserSelections.length === 2) {
        // Doğruluk kontrolü yap
        const correctColors = new Set(prev.currentColors);
        
        // Seçilen renkler doğru mu?
        const isCorrect = newUserSelections.every(color => correctColors.has(color)) && 
                        newUserSelections.length === prev.currentColors.length;
        
        if (isCorrect) {
          // Skoru artır
          setScore(prevScore => prevScore + prev.level * 10);
          
          // Tüm seviyeler tamamlandı mı?
          if (prev.level === 5) {
            toast.success('Tebrikler! Tüm seviyeleri tamamladınız! 🎊', {
              duration: 5000,
              position: 'top-center',
            });
            
            return {
              ...prev,
              userSelections: newUserSelections,
              isUserTurn: false,
              gameOver: true
            };
          } else {
            // Kullanıcının bir sonraki seviyeye geçebilmesi için bildirim
            toast.success(`${prev.level}. seviyeyi tamamladınız! 🎉`, {
              duration: 3000,
            });
            
            return {
              ...prev,
              userSelections: newUserSelections,
              isUserTurn: false
            };
          }
        } else {
          // Yanlış seçim
          toast.error('Yanlış! Tekrar deneyin. 😢', {
            duration: 2000,
          });
          
          // Skoru azalt
          setScore(prevScore => Math.max(0, prevScore - 5));
          
          // Aynı seviyeyi tekrar dene
          setTimeout(() => {
            generateColors(prev.level);
          }, 2000);
          
          return {
            ...prev,
            userSelections: [],
            isUserTurn: false
          };
        }
      }
      
      return {
        ...prev,
        userSelections: newUserSelections
      };
    });
  };

  // Oyunu başlat
  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameState({
      level: 1,
      currentColors: [],
      isUserTurn: false,
      userSelections: [],
      gameOver: false,
      showingColors: false
    });
    
    // İlk seviyeyi başlat
    generateColors(1);
  };

  // Yeni seviyeye geç
  const nextLevel = () => {
    if (gameState.level < 5 && !gameState.isUserTurn) {
      generateColors(gameState.level + 1);
    }
  };

  // Oyunu yeniden başlat
  const restartGame = () => {
    setGameStarted(false);
    setScore(0);
    setGameState({
      level: 1,
      currentColors: [],
      isUserTurn: false,
      userSelections: [],
      gameOver: false,
      showingColors: false
    });
  };

  return (
    <div className="color-perception-container">
      <h1>Renk Algılama</h1>
      
      <div className="game-info">
        <p className="description">
          Görünen renkleri hızlıca algılayın ve doğru renkleri seçin. Her seviyede algılama süreniz azalacak!
        </p>
        
        <div className="stats">
          <div className="stat">
            <span className="label">Seviye:</span>
            <span className="value">{gameState.level}/5</span>
          </div>
          <div className="stat">
            <span className="label">Skor:</span>
            <span className="value">{score}</span>
          </div>
          <div className="stat">
            <span className="label">Süre:</span>
            <span className="value">{LEVEL_DURATIONS[gameState.level as keyof typeof LEVEL_DURATIONS]} saniye</span>
          </div>
        </div>
      </div>
      
      <div className="game-grid">
        {!gameStarted ? (
          <div className="start-screen">
            <h2>Renk Algılama Oyunu</h2>
            <p>Bu oyunda, kısa süreliğine gösterilen iki rengi doğru bir şekilde belirlemeniz gerekiyor.</p>
            <p>Her seviyede renkleri algılama süreniz azalacak:</p>
            <ul>
              <li>Seviye 1: 5 saniye</li>
              <li>Seviye 2: 4 saniye</li>
              <li>Seviye 3: 3 saniye</li>
              <li>Seviye 4: 2 saniye</li>
              <li>Seviye 5: 1 saniye</li>
            </ul>
            <button className="start-button" onClick={startGame}>
              Oyunu Başlat
            </button>
          </div>
        ) : (
          <>
            <div className="game-area">
              {renderCell()}
              
              <div className="game-actions">
                {gameState.gameOver ? (
                  <button className="action-button restart" onClick={restartGame}>
                    Yeniden Başlat
                  </button>
                ) : (
                  <>
                    {!gameState.isUserTurn && !gameState.showingColors && gameState.userSelections.length === 2 && (
                      <button className="action-button next" onClick={nextLevel} disabled={gameState.isUserTurn}>
                        Sonraki Seviye
                      </button>
                    )}
                    {gameState.isUserTurn && (
                      <div className="selections-info">
                        <p>Seçilen Renkler: {gameState.userSelections.length}/2</p>
                        <div className="selections">
                          {gameState.userSelections.map((color, index) => (
                            <div 
                              key={index} 
                              className="selected-color" 
                              style={{ backgroundColor: COLORS[color as keyof typeof COLORS] }}
                            >
                              {color}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <ColorOptions />
          </>
        )}
      </div>
      
      <div className="navigation">
        <Link to="/beyin-antrenoru" className="back-link">
          Beyin Antrenörüne Dön
        </Link>
      </div>
    </div>
  );
};

export default ColorPerception;
