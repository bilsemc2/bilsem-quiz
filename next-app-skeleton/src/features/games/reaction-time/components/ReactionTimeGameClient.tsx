'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type GameMode = 'simple' | 'selective';
type RoundState = 'waiting' | 'go' | 'result';
type StimulusColor = 'green' | 'red' | 'blue' | 'yellow';

interface ReactionTimeGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface ResolveRoundParams {
  success: boolean;
  reactionMs: number | null;
  reason: string;
  waitSuccess?: boolean;
}

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 14;
const MIN_DURATION_SECONDS = 150;
const RESPONSE_WINDOW_MS = 1400;
const TARGET_COLOR: StimulusColor = 'green';

const COLOR_META: Record<StimulusColor, { label: string; hex: string }> = {
  green: { label: 'Yesil', hex: '#22c55e' },
  red: { label: 'Kirmizi', hex: '#ef4444' },
  blue: { label: 'Mavi', hex: '#3b82f6' },
  yellow: { label: 'Sari', hex: '#f59e0b' },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function pickStimulusColor(): StimulusColor {
  const colors: StimulusColor[] = ['green', 'red', 'blue', 'yellow'];
  return colors[randomInt(0, colors.length - 1)] ?? 'green';
}

export function ReactionTimeGameClient({ gameId, gameTitle, durationSeconds }: ReactionTimeGameClientProps) {
  const sessionSeconds = useMemo(
    () => Math.max(MIN_DURATION_SECONDS, Math.floor(durationSeconds)),
    [durationSeconds],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [mode, setMode] = useState<GameMode>('simple');
  const [roundState, setRoundState] = useState<RoundState>('waiting');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [roundIndex, setRoundIndex] = useState(1);
  const [timeLeft, setTimeLeft] = useState(sessionSeconds);
  const [stimulusColor, setStimulusColor] = useState<StimulusColor>('green');
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [waitSuccessCount, setWaitSuccessCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const roundResolvedRef = useRef(false);
  const roundStartTimeRef = useRef(0);
  const waitTimeoutRef = useRef<number | null>(null);
  const responseTimeoutRef = useRef<number | null>(null);
  const nextRoundTimeoutRef = useRef<number | null>(null);

  const clearRoundTimers = useCallback(() => {
    if (waitTimeoutRef.current !== null) {
      window.clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }

    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }

    if (nextRoundTimeoutRef.current !== null) {
      window.clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
  }, []);

  const persistResult = useCallback(
    async (params: {
      finalScore: number;
      remainingLives: number;
      completed: boolean;
      levelReached: number;
      modeUsed: GameMode;
    }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, sessionSeconds - timeLeft);
      const averageReactionMs =
        reactionTimes.length > 0
          ? Math.round(reactionTimes.reduce((sum, current) => sum + current, 0) / reactionTimes.length)
          : 0;
      const bestReactionMs = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;

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
            intelligenceType: 'tepki_suresi',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              mode: params.modeUsed,
              successCount,
              failureCount,
              waitSuccessCount,
              totalAttempts,
              averageReactionMs,
              bestReactionMs,
              bestStreak,
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
    [bestStreak, failureCount, gameId, reactionTimes, roundIndex, sessionSeconds, successCount, timeLeft, totalAttempts, waitSuccessCount],
  );

  const finishGame = useCallback(
    async (params: { completed: boolean; remainingLives: number; finalScore?: number }) => {
      clearRoundTimers();
      setPhase('finished');
      setRoundState('result');

      const finalScore = params.finalScore ?? score;
      if (finalScore !== score) {
        setScore(finalScore);
      }

      await persistResult({
        finalScore,
        remainingLives: params.remainingLives,
        completed: params.completed,
        levelReached: level,
        modeUsed: mode,
      });
    },
    [clearRoundTimers, level, mode, persistResult, score],
  );

  const startRound = useCallback(
    (nextLevel: number, nextRoundIndex: number) => {
      clearRoundTimers();
      roundResolvedRef.current = false;

      setLevel(nextLevel);
      setRoundIndex(nextRoundIndex);
      setRoundState('waiting');
      setLastReactionMs(null);
      setMessage('Hazir ol, sinyali bekle.');

      const waitMs = randomInt(900, 2400);

      waitTimeoutRef.current = window.setTimeout(() => {
        const nextStimulus = mode === 'simple' ? 'green' : pickStimulusColor();

        setStimulusColor(nextStimulus);
        setRoundState('go');
        roundStartTimeRef.current = performance.now();

        responseTimeoutRef.current = window.setTimeout(() => {
          if (roundResolvedRef.current || phase !== 'playing') {
            return;
          }

          if (mode === 'selective' && nextStimulus !== TARGET_COLOR) {
            roundResolvedRef.current = true;
            setRoundState('result');
            setTotalAttempts((previous) => previous + 1);
            setSuccessCount((previous) => previous + 1);
            setWaitSuccessCount((previous) => previous + 1);

            const nextStreak = streak + 1;
            setStreak(nextStreak);
            setBestStreak((previous) => Math.max(previous, nextStreak));

            const gain = 70 + level * 4 + Math.min(18, nextStreak * 3);
            setScore((previous) => previous + gain);
            setMessage(`Dogru bekleme. +${gain} puan`);

            const nextRound = nextRoundIndex + 1;
            const computedLevel = 1 + Math.floor((nextRound - 1) / 3);

            if (nextRound > MAX_ROUNDS) {
              void finishGame({ completed: true, remainingLives: lives });
              return;
            }

            nextRoundTimeoutRef.current = window.setTimeout(() => {
              startRound(computedLevel, nextRound);
            }, 850);
            return;
          }

          roundResolvedRef.current = true;
          setRoundState('result');
          setTotalAttempts((previous) => previous + 1);
          setFailureCount((previous) => previous + 1);
          setStreak(0);
          setMessage('Gec kaldin.');

          const nextLives = lives - 1;
          setLives(nextLives);
          setScore((previous) => Math.max(0, previous - 8));

          if (nextLives <= 0) {
            void finishGame({ completed: false, remainingLives: 0 });
            return;
          }

          const nextRound = nextRoundIndex + 1;
          const computedLevel = 1 + Math.floor((nextRound - 1) / 3);

          if (nextRound > MAX_ROUNDS) {
            void finishGame({ completed: true, remainingLives: nextLives });
            return;
          }

          nextRoundTimeoutRef.current = window.setTimeout(() => {
            startRound(computedLevel, nextRound);
          }, 850);
        }, RESPONSE_WINDOW_MS);
      }, waitMs);
    },
    [clearRoundTimers, finishGame, level, lives, mode, phase, streak],
  );

  const resolveRound = useCallback(
    (params: ResolveRoundParams) => {
      if (phase !== 'playing' || roundResolvedRef.current) {
        return;
      }

      roundResolvedRef.current = true;
      clearRoundTimers();

      setRoundState('result');
      setTotalAttempts((previous) => previous + 1);
      setMessage(params.reason);
      setLastReactionMs(params.reactionMs);

      let nextLives = lives;

      if (params.success) {
        setSuccessCount((previous) => previous + 1);

        if (params.waitSuccess) {
          setWaitSuccessCount((previous) => previous + 1);
        }

        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setBestStreak((previous) => Math.max(previous, nextStreak));

        const gainFromReaction = params.reactionMs !== null ? Math.max(40, 240 - params.reactionMs) : 70;
        const gain = gainFromReaction + level * 4 + Math.min(18, nextStreak * 3);
        setScore((previous) => previous + gain);

        const measuredReaction = params.reactionMs;
        if (measuredReaction !== null) {
          setReactionTimes((previous) => [...previous, measuredReaction]);
        }
      } else {
        setFailureCount((previous) => previous + 1);
        setStreak(0);
        setScore((previous) => Math.max(0, previous - 8));

        nextLives = lives - 1;
        setLives(nextLives);
      }

      if (nextLives <= 0) {
        void finishGame({ completed: false, remainingLives: 0 });
        return;
      }

      const nextRound = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRound - 1) / 3);

      if (nextRound > MAX_ROUNDS) {
        void finishGame({ completed: true, remainingLives: nextLives });
        return;
      }

      nextRoundTimeoutRef.current = window.setTimeout(() => {
        startRound(nextLevel, nextRound);
      }, 850);
    },
    [clearRoundTimers, finishGame, level, lives, phase, roundIndex, startRound, streak],
  );

  const startGame = useCallback(
    (nextMode: GameMode) => {
      hasSavedRef.current = false;
      clearRoundTimers();
      roundResolvedRef.current = false;

      setMode(nextMode);
      setPhase('playing');
      setRoundState('waiting');
      setScore(0);
      setLives(INITIAL_LIVES);
      setLevel(1);
      setRoundIndex(1);
      setTimeLeft(sessionSeconds);
      setStimulusColor('green');
      setLastReactionMs(null);
      setReactionTimes([]);
      setSuccessCount(0);
      setFailureCount(0);
      setWaitSuccessCount(0);
      setTotalAttempts(0);
      setStreak(0);
      setBestStreak(0);
      setMessage('Hazir ol, sinyali bekle.');
      setSaveStatus(null);
      setIsSaving(false);

      startRound(1, 1);
    },
    [clearRoundTimers, sessionSeconds, startRound],
  );

  const handleClick = useCallback(() => {
    if (phase !== 'playing') {
      return;
    }

    if (roundState === 'waiting') {
      resolveRound({ success: false, reactionMs: null, reason: 'Erken tiklama.' });
      return;
    }

    if (roundState !== 'go') {
      return;
    }

    const reactionMs = Math.max(1, Math.round(performance.now() - roundStartTimeRef.current));

    if (mode === 'selective' && stimulusColor !== TARGET_COLOR) {
      resolveRound({ success: false, reactionMs, reason: 'Yanlis renk. Bu tur beklemeliydin.' });
      return;
    }

    resolveRound({ success: true, reactionMs, reason: `Dogru tepki: ${reactionMs} ms` });
  }, [mode, phase, resolveRound, roundState, stimulusColor]);

  useEffect(() => {
    setTimeLeft(sessionSeconds);
  }, [sessionSeconds]);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    if (timeLeft <= 0) {
      const remainingLives = Math.max(0, lives);
      void finishGame({ completed: false, remainingLives });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, lives, phase, timeLeft]);

  useEffect(() => {
    return () => {
      clearRoundTimers();
    };
  }, [clearRoundTimers]);

  const averageReactionMs =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((sum, current) => sum + current, 0) / reactionTimes.length)
      : 0;

  const bestReactionMs = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 780 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Sinyal geldiginde dogru anda tikla. Erken tiklama ceza getirir.</p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(sessionSeconds / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Maksimum tur: {MAX_ROUNDS}</li>
        </ul>

        <div className="grid-2">
          <div className="card stack">
            <strong>Basit Mod</strong>
            <p className="muted" style={{ margin: 0 }}>
              Renk yesile donunce hemen tikla.
            </p>
            <Button onClick={() => startGame('simple')}>Basit Modu Baslat</Button>
          </div>

          <div className="card stack">
            <strong>Secmeli Mod</strong>
            <p className="muted" style={{ margin: 0 }}>
              Sadece hedef renk yesilse tikla, diger renklerde bekle.
            </p>
            <Button onClick={() => startGame('selective')}>Secmeli Modu Baslat</Button>
          </div>
        </div>

        <div>
          <Link className="btn btn-ghost" href="/games">
            Oyun listesine don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 920 }}>
      <div className="card" style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        <div>
          <div className="muted">Puan</div>
          <strong>{score}</strong>
        </div>
        <div>
          <div className="muted">Can</div>
          <strong>{lives}</strong>
        </div>
        <div>
          <div className="muted">Tur</div>
          <strong>
            {Math.min(roundIndex, MAX_ROUNDS)} / {MAX_ROUNDS}
          </strong>
        </div>
        <div>
          <div className="muted">Seviye</div>
          <strong>{level}</strong>
        </div>
        <div>
          <div className="muted">Mod</div>
          <strong>{mode === 'simple' ? 'Basit' : 'Secmeli'}</strong>
        </div>
        <div>
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'playing' ? (
        <div className="card stack" style={{ gap: '0.9rem' }}>
          <p style={{ margin: 0 }}>
            {mode === 'selective'
              ? `Hedef renk: ${COLOR_META[TARGET_COLOR].label}.`
              : 'Renk degisiminde hizli tepki ver.'}
          </p>

          <button
            type="button"
            onClick={handleClick}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 16,
              minHeight: 220,
              cursor: roundState === 'result' ? 'default' : 'pointer',
              background:
                roundState === 'go'
                  ? COLOR_META[stimulusColor].hex
                  : roundState === 'waiting'
                    ? 'rgba(15, 23, 42, 0.08)'
                    : 'rgba(37, 99, 235, 0.12)',
              color: roundState === 'go' && stimulusColor === 'yellow' ? '#111827' : '#ffffff',
              fontWeight: 800,
              fontSize: '1.2rem',
            }}
          >
            {roundState === 'waiting' ? 'Bekle...' : null}
            {roundState === 'go' && mode === 'simple' ? 'HEMEN TIKLA' : null}
            {roundState === 'go' && mode === 'selective' && stimulusColor === TARGET_COLOR ? 'HEDEF RENK - TIKLA' : null}
            {roundState === 'go' && mode === 'selective' && stimulusColor !== TARGET_COLOR ? 'BU RENKTE BEKLE' : null}
            {roundState === 'result' ? 'Sonuc' : null}
          </button>

          <div className="muted">
            Son tepki: {lastReactionMs !== null ? `${lastReactionMs} ms` : '-'}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="muted" style={{ marginTop: '-0.2rem' }}>
          {message}
        </p>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack" style={{ gap: '0.8rem' }}>
          <h2 style={{ margin: 0 }}>Oyun Tamamlandi</h2>
          <ul className="muted" style={{ margin: 0 }}>
            <li>Skor: {score}</li>
            <li>Basarili tur: {successCount}</li>
            <li>Hatali tur: {failureCount}</li>
            <li>Dogru bekleme: {waitSuccessCount}</li>
            <li>Ortalama tepki: {averageReactionMs > 0 ? `${averageReactionMs} ms` : '-'}</li>
            <li>En iyi tepki: {bestReactionMs > 0 ? `${bestReactionMs} ms` : '-'}</li>
            <li>En iyi seri: {bestStreak}</li>
          </ul>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={() => startGame(mode)}>Ayni Modu Tekrar Oyna</Button>
            <Button variant="secondary" onClick={() => startGame(mode === 'simple' ? 'selective' : 'simple')}>
              Diger Moda Gec
            </Button>
            <Link className="btn btn-ghost" href="/games">
              Oyun listesine don
            </Link>
          </div>

          <p className="muted" style={{ margin: 0 }}>
            {isSaving ? 'Sonuc kaydediliyor...' : saveStatus ?? 'Sonuc kaydi bekleniyor'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
