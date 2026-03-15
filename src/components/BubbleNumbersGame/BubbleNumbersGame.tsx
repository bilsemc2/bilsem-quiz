import React from 'react';
import { Clock3, Layers3, Pause, Play, Star, Target, Volume2, VolumeX } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bubbleNumbersGameCanvasSize, useBubbleNumbersGame } from './hooks/useBubbleNumbersGame';
import { BubblePowerUpsBar } from './components/BubblePowerUpsBar';
import { BubbleGameOverlay } from './components/BubbleGameOverlay';
import { formatBubbleGameTime } from './model/bubbleNumbersGameModel';
import { KidGameShell, KidIconButton } from '../kid-ui';
import { useGameViewportFocus } from '../../hooks/useGameViewportFocus';

const BubbleNumbersGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playAreaRef, focusPlayArea } = useGameViewportFocus();
  const previousState = location.state?.previousState;
  const {
    canvasRef,
    targetNumber,
    score,
    timeLeft,
    gameOver,
    level,
    isPaused,
    isMuted,
    powerUpStates,
    handleCanvasClick,
    handlePowerUp,
    togglePause,
    toggleMute
  } = useBubbleNumbersGame({ focusPlayArea });

  const quizId = location.state?.quizId || previousState?.quizId;
  const quizResultPath = quizId ? `/quiz/${quizId}/result` : '/result';

  const handleReturnToResults = () => {
    navigate(quizResultPath, {
      state: {
        ...previousState,
        gameScore: score,
        fromBubbleGame: true
      },
      replace: true
    });
  };

  const handleResume = () => {
    togglePause();
    focusPlayArea();
  };

  return (
    <KidGameShell
      title="Baloncuk Avı"
      subtitle="Doğru sonucu bul, baloncukları patlat ve seviyeyi büyüt."
      instruction="Hedef sayıyı veren işlemi seç. Yanlış seçim hem puandan hem süreden götürür."
      onBack={handleReturnToResults}
      backLabel="Sonuçlara Dön"
      badges={[
        { label: 'Matematik Oyunu', variant: 'difficulty' },
        { label: 'Hız ve Dikkat', variant: 'status' }
      ]}
      stats={[
        { label: 'Seviye', value: level, tone: 'emerald', icon: Layers3 },
        { label: 'Hedef', value: targetNumber, tone: 'yellow', icon: Target },
        { label: 'Puan', value: score, tone: 'blue', icon: Star },
        {
          label: 'Süre',
          value: formatBubbleGameTime(timeLeft),
          tone: timeLeft <= 10 ? 'pink' : 'orange',
          emphasis: timeLeft <= 10 ? 'danger' : 'default',
          icon: Clock3,
          helper: timeLeft <= 10 ? 'Hızlanma zamanı' : 'Rahat ama dikkatli ilerle'
        }
      ]}
      toolbar={(
        <>
          <KidIconButton
            icon={isPaused ? Play : Pause}
            label={isPaused ? 'Oyunu devam ettir' : 'Oyunu duraklat'}
            onClick={togglePause}
            className={isPaused ? 'bg-cyber-emerald text-black' : 'bg-white/90 dark:bg-slate-800'}
          />
          <KidIconButton
            icon={isMuted ? VolumeX : Volume2}
            label={isMuted ? 'Sesi ac' : 'Sesi kapat'}
            onClick={toggleMute}
            className={isMuted ? 'bg-cyber-pink text-white' : 'bg-white/90 dark:bg-slate-800'}
          />
        </>
      )}
      supportArea={(
        <BubblePowerUpsBar
          powerUpStates={powerUpStates}
          disabled={gameOver || isPaused}
          onUsePowerUp={handlePowerUp}
        />
      )}
      supportTitle="Güç Destekleri"
      supportDescription="Zorlandığında tek dokunuşla küçük avantajlar kullan."
      playAreaRef={playAreaRef}
      overlay={(
        <BubbleGameOverlay
          gameOver={gameOver}
          isPaused={isPaused}
          level={level}
          score={score}
          onResume={handleResume}
          onReturnToResults={handleReturnToResults}
        />
      )}
    >
      <div className="flex w-full justify-center overflow-x-auto pb-2">
        <div className="rounded-[2rem] border-4 border-black/10 bg-white/85 p-2 shadow-neo-lg dark:border-white/10 dark:bg-slate-900/80">
          <canvas
            ref={canvasRef}
            width={bubbleNumbersGameCanvasSize.width}
            height={bubbleNumbersGameCanvasSize.height}
            className="block rounded-[1.5rem] bg-[linear-gradient(180deg,#ffffff_0%,#ecfeff_100%)] shadow-inner"
            onClick={handleCanvasClick}
            style={{ filter: isPaused ? 'blur(3px)' : 'none' }}
          />
        </div>
      </div>
    </KidGameShell>
  );
};

export default BubbleNumbersGame;
