import Link from 'next/link';

import { Card } from '@/shared/ui/Card';
import type { GameSummary } from '@/shared/types/domain';

interface GameCardProps {
  game: GameSummary;
}

export function GameCard({ game }: GameCardProps) {
  const minutes = Math.ceil(game.durationSeconds / 60);

  return (
    <Card title={game.title}>
      {game.description ? <p>{game.description}</p> : null}
      <p className="muted">Kategori: {game.category}</p>
      <p className="muted">Sure: {minutes} dk</p>
      {typeof game.playsCount === 'number' ? <p className="muted">Oynanma: {game.playsCount}</p> : null}
      {typeof game.avgScore === 'number' ? <p className="muted">Ort. skor: {game.avgScore}</p> : null}
      {typeof game.bestScore === 'number' ? <p className="muted">En iyi skor: {game.bestScore}</p> : null}
      <p className="muted">Durum: {game.migrated ? 'Hazir' : 'Tasiniyor'}</p>

      <div style={{ marginTop: '0.75rem' }}>
        <Link className="btn btn-secondary" href={`/games/${game.id}`}>
          Oyunu Ac
        </Link>
      </div>
    </Card>
  );
}
