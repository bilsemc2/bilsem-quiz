'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type SymbolId = 'square' | 'circle' | 'triangle' | 'diamond' | 'star' | 'hexagon';

interface NBackGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface SymbolToken {
  id: SymbolId;
  token: string;
  label: string;
}

interface RoundData {
  symbolId: SymbolId;
  expectedMatch: boolean;
  referenceSymbolId: SymbolId | null;
}

const INITIAL_LIVES = 5;
const MAX_ROUNDS = 22;
const MIN_DURATION_SECONDS = 150;

const SYMBOLS: SymbolToken[] = [
  { id: 'square', token: '[]', label: 'Kare' },
  { id: 'circle', token: 'O', label: 'Daire' },
  { id: 'triangle', token: 'TRI', label: 'Ucgen' },
  { id: 'diamond', token: 'DIA', label: 'Elmas' },
  { id: 'star', token: 'STAR', label: 'Yildiz' },
  { id: 'hexagon', token: 'HEX', label: 'Altigen' },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function symbolMeta(symbolId: SymbolId): SymbolToken {
  return SYMBOLS.find((symbol) => symbol.id === symbolId) ?? SYMBOLS[0];
}

function nValueForLevel(level: number): number {
  if (level <= 5) {
    return 1;
  }

  if (level <= 10) {
    return 2;
  }

  return 3;
}

function pickRandomSymbol(candidates: SymbolId[]): SymbolId {
  return candidates[randomInt(0, candidates.length - 1)];
}

function createRound(history: SymbolId[], nValue: number): RoundData {
  const hasReference = history.length >= nValue;
  const referenceSymbolId = hasReference ? history[history.length - nValue] : null;
  const shouldMatch = hasReference && Math.random() < 0.35;

  if (shouldMatch && referenceSymbolId) {
    return {
      symbolId: referenceSymbolId,
      expectedMatch: true,
      referenceSymbolId,
    };
  }

  const candidates = referenceSymbolId
    ? SYMBOLS.map((symbol) => symbol.id).filter((symbolId) => symbolId !== referenceSymbolId)
    : SYMBOLS.map((symbol) => symbol.id);

  return {
    symbolId: pickRandomSymbol(candidates),
    expectedMatch: false,
    referenceSymbolId,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function NBackGameClient({ gameId, gameTitle, durationSeconds }: NBackGameClientProps) {
  const sessionSeconds = useMemo(
    () => Math.max(MIN_DURATION_SECONDS, Math.floor(durationSeconds)),
    [durationSeconds],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [roundIndex, setRoundIndex] = useState(1);
  const [timeLeft, setTimeLeft] = useState(sessionSeconds);
  const [nValue, setNValue] = useState(1);
  const [history, setHistory] = useState<SymbolId[]>([]);
  const [round, setRound] = useState<RoundData | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);

  const persistResult = useCallback(
    async (params: { finalScore: number; remainingLives: number; completed: boolean; levelReached: number }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, sessionSeconds - timeLeft);
      const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

      try {
        const response = await fetch('/api/game-plays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId,
            scoreAchieved: params.finalScore,
            durationSeconds: playedSeconds,
            livesRemaining: params.remainingLives,
            workshopType: 'bireysel',
            intelligenceType: 'calisma_bellek',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              nValue,
              correctCount,
              totalAttempts,
              accuracyPercent,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { id?: string };
        setSaveStatus(payload.id ? `Kaydedildi (${payload.id.slice(0, 8)})` : 'Kaydedildi');
      } catch (error) {
        setSaveStatus(error instanceof Error ? `Kayit hatasi: ${error.message}` : 'Kayit hatasi');
      } finally {
        setIsSaving(false);
      }
    },
    [correctCount, gameId, nValue, roundIndex, sessionSeconds, timeLeft, totalAttempts],
  );

  const finishGame = useCallback(
    async (params: { completed: boolean; remainingLives: number; finalScore?: number }) => {
      setPhase('finished');
      const finalScore = params.finalScore ?? score;

      if (finalScore !== score) {
        setScore(finalScore);
      }

      await persistResult({
        finalScore,
        remainingLives: params.remainingLives,
        completed: params.completed,
        levelReached: level,
      });
    },
    [level, persistResult, score],
  );

  const startGame = useCallback(() => {
    const initialN = 1;
    const initialHistory: SymbolId[] = [];
    const initialRound = createRound(initialHistory, initialN);

    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setRoundIndex(1);
    setTimeLeft(sessionSeconds);
    setNValue(initialN);
    setHistory(initialHistory);
    setRound(initialRound);
    setCorrectCount(0);
    setTotalAttempts(0);
    setMessage('Sembol n-adim onceki ile ayniysa Eslesme Var sec.');
    setSaveStatus(null);
    setIsSaving(false);
    setPhase('playing');
  }, [sessionSeconds]);

  useEffect(() => {
    setTimeLeft(sessionSeconds);
  }, [sessionSeconds]);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    if (timeLeft <= 0) {
      void finishGame({ completed: false, remainingLives: lives });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, lives, phase, timeLeft]);

  const handleDecision = useCallback(
    (userSaysMatch: boolean) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const correct = userSaysMatch === round.expectedMatch;
      const nextAttempts = totalAttempts + 1;
      const nextHistory = [...history, round.symbolId].slice(-24);
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 3);
      const nextN = nValueForLevel(nextLevel);

      setTotalAttempts(nextAttempts);

      if (correct) {
        const gained = 10 + level * 2 + (nValue - 1) * 3;
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru karar. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        setRoundIndex(nextRoundIndex);
        setLevel(nextLevel);
        setNValue(nextN);
        setHistory(nextHistory);
        setRound(createRound(nextHistory, nextN));
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setMessage(
        round.expectedMatch
          ? 'Yanlis. Bu tur aslinda eslesme vardi.'
          : 'Yanlis. Bu tur eslesme yoktu.',
      );

      if (nextLives <= 0) {
        void finishGame({ completed: false, remainingLives: 0 });
        return;
      }

      if (nextRoundIndex > MAX_ROUNDS) {
        void finishGame({ completed: true, remainingLives: nextLives });
        return;
      }

      setRoundIndex(nextRoundIndex);
      setLevel(nextLevel);
      setNValue(nextN);
      setHistory(nextHistory);
      setRound(createRound(nextHistory, nextN));
    },
    [finishGame, history, level, lives, nValue, phase, round, roundIndex, score, totalAttempts],
  );

  const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const currentSymbol = round ? symbolMeta(round.symbolId) : null;
  const referenceSymbol = round?.referenceSymbolId ? symbolMeta(round.referenceSymbolId) : null;
  const recentHistory = history.slice(-8).map((item) => symbolMeta(item));

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Her turda yeni bir sembol gorursun. Sembol n-adim oncekiyle ayniysa Eslesme Var sec.
        </p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(sessionSeconds / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Maksimum tur: {MAX_ROUNDS}</li>
        </ul>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={startGame}>Oyunu Baslat</Button>
          <Link className="btn btn-ghost" href="/games">
            Oyun listesine don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <h1>{gameTitle}</h1>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Tur: {roundIndex} / {MAX_ROUNDS}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">N degeri: {nValue}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          <p className="muted">Dogruluk: %{accuracyPercent}</p>
          {message ? <p>{message}</p> : null}
        </div>

        <div className="card stack-sm" style={{ textAlign: 'center' }}>
          <h2 className="card-title">Aktif Sembol</h2>
          <p
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '0.2rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {currentSymbol?.token ?? '-'}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {currentSymbol?.label ?? '-'}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Referans ({nValue}-geri): {referenceSymbol ? `${referenceSymbol.token} (${referenceSymbol.label})` : '-'}
          </p>
        </div>
      </div>

      <div className="card stack-sm">
        <h2 className="card-title">Karar</h2>
        <p className="muted">Bu turdaki sembol, {nValue} adim onceki sembolle ayni mi?</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button disabled={phase !== 'playing'} onClick={() => handleDecision(true)}>
            Eslesme Var
          </Button>
          <Button variant="secondary" disabled={phase !== 'playing'} onClick={() => handleDecision(false)}>
            Eslesme Yok
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              finishGame({
                completed: false,
                remainingLives: lives,
              })
            }
          >
            Bitir
          </Button>
        </div>
      </div>

      <div className="card stack-sm">
        <h2 className="card-title">Gecmis</h2>
        <p className="muted">Son 8 sembol</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {recentHistory.length > 0 ? (
            recentHistory.map((symbol, index) => (
              <div key={`${symbol.id}-${index}`} className="card" style={{ padding: '0.5rem 0.75rem' }}>
                {symbol.token}
              </div>
            ))
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Henuz gecmis olusmadi.
            </p>
          )}
        </div>
      </div>

      {phase === 'finished' ? (
        <div className="card stack-sm">
          <h2 className="card-title">Oyun Tamamlandi</h2>
          <p className="muted">Nihai skor: {score}</p>
          <p className="muted">Ulasilan seviye: {level}</p>
          <p className="muted">Son N degeri: {nValue}</p>
          <p className="muted">Dogruluk: %{accuracyPercent}</p>
          {isSaving ? <p className="muted">Sonuc kaydediliyor...</p> : null}
          {saveStatus ? <p className="muted">{saveStatus}</p> : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={startGame}>Tekrar Baslat</Button>
            <Link className="btn btn-ghost" href="/games">
              Oyun listesine don
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
