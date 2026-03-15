import React from 'react';
import { PauseCircle, Sparkles, Trophy } from 'lucide-react';
import { KidGameStatusOverlay } from '../../kid-ui';

interface BubbleGameOverlayProps {
  gameOver: boolean;
  isPaused: boolean;
  level: number;
  score: number;
  onResume: () => void;
  onReturnToResults: () => void;
}

export const BubbleGameOverlay: React.FC<BubbleGameOverlayProps> = ({
  gameOver,
  isPaused,
  level,
  score,
  onResume,
  onReturnToResults
}) => {
  if (!gameOver && !isPaused) {
    return null;
  }

  return (
    gameOver ? (
      <KidGameStatusOverlay
        tone="pink"
        icon={Trophy}
        title="Oyun Bitti"
        description="Güzel bir tur oynadın. Şimdi sonucu kaydedip kaldığın yerden devam edebilirsin."
        maxWidthClassName="max-w-md"
        stats={[
          { label: 'Seviye', value: level, tone: 'yellow' },
          { label: 'Puan', value: score, tone: 'blue' }
        ]}
        actions={[
          { label: 'Sonuçlara Dön', variant: 'success', icon: Sparkles, onClick: onReturnToResults }
        ]}
      />
    ) : (
      <KidGameStatusOverlay
        tone="blue"
        icon={PauseCircle}
        title="Oyun Duraklatıldı"
        description="Hazır olduğunda tek dokunuşla oyuna geri dönebilirsin."
        maxWidthClassName="max-w-md"
        actions={[
          { label: 'Devam Et', variant: 'secondary', icon: Sparkles, onClick: onResume },
          { label: 'Sonuçlara Dön', variant: 'ghost', onClick: onReturnToResults }
        ]}
      />
    )
  );
};
