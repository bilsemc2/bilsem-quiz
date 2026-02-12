import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AttentionCodingGameClient } from '@/features/games/attention-coding/components/AttentionCodingGameClient';
import { AuditoryMemoryGameClient } from '@/features/games/auditory-memory/components/AuditoryMemoryGameClient';
import { ClockProblemGameClient } from '@/features/games/clock-problem/components/ClockProblemGameClient';
import { CosmicMemoryGameClient } from '@/features/games/cosmic-memory/components/CosmicMemoryGameClient';
import { getRegistryItem } from '@/features/games/game-registry';
import { LaserMazeGameClient } from '@/features/games/laser-maze/components/LaserMazeGameClient';
import { MathMagicGameClient } from '@/features/games/math-magic/components/MathMagicGameClient';
import { MathGridGameClient } from '@/features/games/math-grid/components/MathGridGameClient';
import { MazeGameClient } from '@/features/games/maze/components/MazeGameClient';
import { NBackGameClient } from '@/features/games/n-back/components/NBackGameClient';
import { NumberCipherGameClient } from '@/features/games/number-cipher/components/NumberCipherGameClient';
import { NumberMemoryGameClient } from '@/features/games/number-memory/components/NumberMemoryGameClient';
import { NumberSequenceGameClient } from '@/features/games/number-sequence/components/NumberSequenceGameClient';
import { PerceptualSpeedGameClient } from '@/features/games/perceptual-speed/components/PerceptualSpeedGameClient';
import { ReactionTimeGameClient } from '@/features/games/reaction-time/components/ReactionTimeGameClient';
import { SpotDifferenceGameClient } from '@/features/games/spot-difference/components/SpotDifferenceGameClient';
import { SymbolMatchGameClient } from '@/features/games/symbol-match/components/SymbolMatchGameClient';
import { SymbolSearchGameClient } from '@/features/games/symbol-search/components/SymbolSearchGameClient';
import { SynonymGameClient } from '@/features/games/synonym/components/SynonymGameClient';
import { VerbalAnalogyGameClient } from '@/features/games/verbal-analogy/components/VerbalAnalogyGameClient';
import { VisualMemoryGameClient } from '@/features/games/visual-memory/components/VisualMemoryGameClient';
import { VisualScanningGameClient } from '@/features/games/visual-scanning/components/VisualScanningGameClient';
import { WordHuntGameClient } from '@/features/games/word-hunt/components/WordHuntGameClient';
import { getGameById } from '@/server/services/game.service';

interface GameDetailPageProps {
  params: Promise<{ gameId: string }>;
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { gameId } = await params;

  const game = await getGameById(gameId);
  const registry = getRegistryItem(gameId);

  if (!game && !registry) {
    notFound();
  }

  const resolvedGame = game ?? {
    id: registry!.id,
    title: registry!.title,
    category: registry!.category,
    durationSeconds: registry!.durationSeconds,
    description: registry!.description,
    migrated: registry!.migrated,
  };

  if (resolvedGame.id === 'farki-bul' || resolvedGame.id === 'spot-difference') {
    return (
      <SpotDifferenceGameClient
        gameId="farki-bul"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'kelime-avi' || resolvedGame.id === 'word-hunt') {
    return (
      <WordHuntGameClient
        gameId="kelime-avi"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'attention-coding' || resolvedGame.id === 'dikkat-ve-kodlama') {
    return (
      <AttentionCodingGameClient
        gameId="dikkat-ve-kodlama"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'sembol-arama' || resolvedGame.id === 'symbol-search') {
    return (
      <SymbolSearchGameClient
        gameId="sembol-arama"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'sekil-hafizasi' || resolvedGame.id === 'symbol-match') {
    return (
      <SymbolMatchGameClient
        gameId="sekil-hafizasi"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'gorsel-tarama' || resolvedGame.id === 'visual-scanning') {
    return (
      <VisualScanningGameClient
        gameId="gorsel-tarama"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'isitsel-hafiza' || resolvedGame.id === 'auditory-memory') {
    return (
      <AuditoryMemoryGameClient
        gameId="isitsel-hafiza"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'tepki-suresi' || resolvedGame.id === 'reaction-time') {
    return (
      <ReactionTimeGameClient
        gameId="tepki-suresi"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'sozel-analoji' || resolvedGame.id === 'verbal-analogy') {
    return (
      <VerbalAnalogyGameClient
        gameId="sozel-analoji"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'es-anlam' || resolvedGame.id === 'synonym') {
    return <SynonymGameClient gameId="es-anlam" gameTitle={resolvedGame.title} durationSeconds={resolvedGame.durationSeconds} />;
  }

  if (resolvedGame.id === 'sayi-sihirbazi' || resolvedGame.id === 'math-magic') {
    return (
      <MathMagicGameClient
        gameId="sayi-sihirbazi"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'matematik-grid' || resolvedGame.id === 'math-grid') {
    return (
      <MathGridGameClient
        gameId="matematik-grid"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'gorsel-hafiza' || resolvedGame.id === 'visual-memory') {
    return (
      <VisualMemoryGameClient
        gameId="gorsel-hafiza"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'sayisal-hafiza' || resolvedGame.id === 'number-memory') {
    return (
      <NumberMemoryGameClient
        gameId="sayisal-hafiza"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'sayisal-dizi' || resolvedGame.id === 'number-sequence') {
    return (
      <NumberSequenceGameClient
        gameId="sayisal-dizi"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'sayisal-sifre' || resolvedGame.id === 'number-cipher') {
    return (
      <NumberCipherGameClient
        gameId="sayisal-sifre"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'n-geri-sifresi' || resolvedGame.id === 'n-back') {
    return (
      <NBackGameClient
        gameId="n-geri-sifresi"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'kozmik-hafiza' || resolvedGame.id === 'cosmic-memory') {
    return (
      <CosmicMemoryGameClient
        gameId="kozmik-hafiza"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'lazer-labirent' || resolvedGame.id === 'laser-maze') {
    return (
      <LaserMazeGameClient
        gameId="lazer-labirent"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'saat-problemi' || resolvedGame.id === 'clock-problem') {
    return (
      <ClockProblemGameClient
        gameId="saat-problemi"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'labirent' || resolvedGame.id === 'maze') {
    return (
      <MazeGameClient
        gameId="labirent"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  if (resolvedGame.id === 'algisal-hiz' || resolvedGame.id === 'perceptual-speed') {
    return (
      <PerceptualSpeedGameClient
        gameId="algisal-hiz"
        gameTitle={resolvedGame.title}
        durationSeconds={resolvedGame.durationSeconds}
      />
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <h1>{resolvedGame.title}</h1>
      <p className="muted">Bu oyun routeu acildi ancak full migration henuz tamamlanmadi.</p>
      {resolvedGame.description ? <p>{resolvedGame.description}</p> : null}
      <ul>
        <li>Kategori: {resolvedGame.category}</li>
        <li>Sure: {Math.ceil(resolvedGame.durationSeconds / 60)} dakika</li>
        <li>Durum: Tasiniyor</li>
      </ul>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link className="btn btn-primary" href="/games">
          Oyun listesine don
        </Link>
      </div>
    </div>
  );
}
