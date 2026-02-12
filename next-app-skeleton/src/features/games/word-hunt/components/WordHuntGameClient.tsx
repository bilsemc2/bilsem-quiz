'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'exposure' | 'playing' | 'finished';

interface LevelConfig {
  wordLength: number;
  itemCount: number;
  roundDuration: number;
  flashDuration: number;
  useBigram: boolean;
}

interface WordItem {
  id: string;
  text: string;
  hasTarget: boolean;
}

interface RoundSummary {
  correct: number;
  totalTargets: number;
  falsePositives: number;
  accuracy: number;
  pointsGained: number;
  success: boolean;
}

interface FinishGameOptions {
  completed: boolean;
  remainingLives: number;
  levelsCompleted: number;
  finalScoreOverride?: number;
}

interface WordHuntGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

const INITIAL_LIVES = 5;
const MAX_LEVEL = 20;

const ALPHABET = [...'ABCDEFGHIJKLMNOPRSTUVWXYZ'];
const VOWELS = [...'AEIIOOUU'];
const CONSONANTS = [...'BCDFGHJKLMNPRSTVWXYZ'];
const BIGRAMS = [
  'AR',
  'ER',
  'AN',
  'AL',
  'LA',
  'RA',
  'TE',
  'SE',
  'IN',
  'DE',
  'DA',
  'EN',
  'EL',
  'MA',
  'ME',
  'TA',
  'SA',
  'YA',
  'YE',
  'UR',
  'UN',
  'US',
  'UT',
  'AK',
  'EK',
  'IL',
  'OL',
];

const TRAP_MAP: Record<string, string[]> = {
  A: ['E'],
  E: ['A'],
  I: ['O'],
  O: ['I'],
  U: ['O'],
  S: ['Z'],
  C: ['G'],
  G: ['C'],
  K: ['G'],
};

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

function getLevelConfig(level: number): LevelConfig {
  if (level <= 5) {
    return {
      wordLength: 5,
      itemCount: 8,
      roundDuration: 4.5 - (level - 1) * 0.1,
      flashDuration: 0.6,
      useBigram: false,
    };
  }

  if (level <= 10) {
    return {
      wordLength: 6,
      itemCount: 9,
      roundDuration: 3.8 - (level - 6) * 0.1,
      flashDuration: 0.55,
      useBigram: level >= 8,
    };
  }

  if (level <= 15) {
    return {
      wordLength: 7,
      itemCount: 10,
      roundDuration: 3.2 - (level - 11) * 0.1,
      flashDuration: 0.5,
      useBigram: true,
    };
  }

  return {
    wordLength: 8,
    itemCount: 12,
    roundDuration: 2.6 - (level - 16) * 0.05,
    flashDuration: 0.4,
    useBigram: true,
  };
}

function makePseudoWord(length: number): string {
  let word = '';
  let useVowel = Math.random() > 0.45;

  for (let index = 0; index < length; index += 1) {
    word += useVowel ? pick(VOWELS) : pick(CONSONANTS);
    useVowel = !useVowel;
    if (Math.random() < 0.18) {
      useVowel = !useVowel;
    }
  }

  return word;
}

function insertTarget(word: string, target: string): string {
  if (word.length < target.length) {
    return target;
  }

  const start = Math.floor(Math.random() * (word.length - target.length + 1));
  return word.slice(0, start) + target + word.slice(start + target.length);
}

function replacementForTarget(target: string): string {
  if (target.length === 1) {
    return pick(ALPHABET.filter((letter) => letter !== target));
  }

  let replacement = target;
  while (replacement === target) {
    replacement = `${pick(ALPHABET)}${pick(ALPHABET)}`;
  }
  return replacement;
}

function applyTrap(word: string, target: string): string {
  const candidates = target
    .split('')
    .map((char) => TRAP_MAP[char])
    .filter(Boolean)
    .flat();

  if (candidates.length === 0) {
    return word;
  }

  const index = Math.floor(Math.random() * word.length);
  const replaced = word.slice(0, index) + pick(candidates) + word.slice(index + 1);
  return replaced.includes(target) ? word : replaced;
}

function makeNonTarget(length: number, target: string): string {
  let word = '';
  let guard = 0;

  do {
    word = makePseudoWord(length);
    guard += 1;
  } while (word.includes(target) && guard < 20);

  if (word.includes(target)) {
    const index = word.indexOf(target);
    const replacement = replacementForTarget(target);
    word = word.slice(0, index) + replacement + word.slice(index + target.length);
  }

  if (Math.random() < 0.6) {
    const trapped = applyTrap(word, target);
    return trapped.includes(target) ? word : trapped;
  }

  return word;
}

function generateItems(target: string, length: number, count: number): WordItem[] {
  const targetCountBase = Math.round(count * 0.5);
  const variance = Math.floor(Math.random() * 3) - 1;
  const targetCount = Math.min(count - 2, Math.max(2, targetCountBase + variance));

  const items: WordItem[] = [];
  for (let index = 0; index < count; index += 1) {
    const hasTarget = index < targetCount;
    const base = makePseudoWord(length);
    const text = hasTarget ? insertTarget(base, target) : makeNonTarget(length, target);

    items.push({
      id: `${index}-${text}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      hasTarget,
    });
  }

  return shuffle(items);
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function WordHuntGameClient({ gameId, gameTitle, durationSeconds }: WordHuntGameClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [target, setTarget] = useState('-');
  const [items, setItems] = useState<WordItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roundDuration, setRoundDuration] = useState(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState(0);
  const [roundLocked, setRoundLocked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const exposureTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const roundAnimationRef = useRef<number | null>(null);
  const resolveRoundRef = useRef(false);
  const resolveRoundHandlerRef = useRef<() => void>(() => undefined);

  const clearExposureTimer = useCallback(() => {
    if (exposureTimerRef.current !== null) {
      window.clearTimeout(exposureTimerRef.current);
      exposureTimerRef.current = null;
    }
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const clearRoundAnimation = useCallback(() => {
    if (roundAnimationRef.current !== null) {
      window.cancelAnimationFrame(roundAnimationRef.current);
      roundAnimationRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearExposureTimer();
    clearTransitionTimer();
    clearRoundAnimation();
  }, [clearExposureTimer, clearRoundAnimation, clearTransitionTimer]);

  const startLevel = useCallback(
    (nextLevel: number) => {
      clearExposureTimer();
      clearRoundAnimation();
      clearTransitionTimer();

      const config = getLevelConfig(nextLevel);
      const nextTarget = config.useBigram ? pick(BIGRAMS) : pick(ALPHABET);
      const roundItems = generateItems(nextTarget, config.wordLength, config.itemCount);

      resolveRoundRef.current = false;
      setLevel(nextLevel);
      setTarget(nextTarget);
      setItems(roundItems);
      setSelectedIds(new Set());
      setRoundSummary(null);
      setFeedback(null);
      setRoundLocked(true);
      setRoundDuration(config.roundDuration);
      setRoundTimeLeft(config.roundDuration);
      setPhase('exposure');

      exposureTimerRef.current = window.setTimeout(() => {
        setPhase('playing');
        setRoundLocked(false);
      }, config.flashDuration * 1000);
    },
    [clearExposureTimer, clearRoundAnimation, clearTransitionTimer],
  );

  const persistResult = useCallback(
    async (params: { finalScore: number; remainingLives: number; completed: boolean; levelsCompleted: number }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, durationSeconds - timeLeft);

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
            intelligenceType: 'sozel',
            metadata: {
              completed: params.completed,
              levelsCompleted: params.levelsCompleted,
              source: 'word-hunt-migrated',
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { id?: string };
        if (payload.id) {
          setSaveStatus(`Sonuc kaydedildi (${payload.id.slice(0, 8)})`);
        } else {
          setSaveStatus('Sonuc kaydedildi');
        }
      } catch (error) {
        setSaveStatus(error instanceof Error ? `Kayit hatasi: ${error.message}` : 'Kayit hatasi');
      } finally {
        setIsSaving(false);
      }
    },
    [durationSeconds, gameId, timeLeft],
  );

  const finishGame = useCallback(
    async ({ completed, remainingLives, levelsCompleted, finalScoreOverride }: FinishGameOptions) => {
      clearAllTimers();
      resolveRoundRef.current = false;
      setPhase('finished');
      setRoundLocked(true);

      const completionBonus = completed ? 250 : 0;
      const baseScore = finalScoreOverride ?? score;
      const finalScore = baseScore + (finalScoreOverride === undefined ? completionBonus : 0);

      if (completionBonus > 0 && finalScoreOverride === undefined) {
        setScore(finalScore);
      }

      await persistResult({
        finalScore,
        remainingLives,
        completed,
        levelsCompleted,
      });
    },
    [clearAllTimers, persistResult, score],
  );

  const resolveRound = useCallback(() => {
    if (phase !== 'playing' || roundLocked || resolveRoundRef.current) {
      return;
    }

    resolveRoundRef.current = true;
    clearRoundAnimation();
    setRoundLocked(true);

    const totalTargets = items.filter((item) => item.hasTarget).length;
    const correct = items.filter((item) => item.hasTarget && selectedIds.has(item.id)).length;
    const falsePositives = Math.max(0, selectedIds.size - correct);
    const accuracy = totalTargets > 0 ? correct / totalTargets : 0;
    const success = accuracy >= 0.5;
    const gained = success ? 10 * level + Math.round(roundTimeLeft * 25) : 0;

    setRoundSummary({
      correct,
      totalTargets,
      falsePositives,
      accuracy,
      pointsGained: gained,
      success,
    });

    if (success) {
      const nextScore = score + gained;
      setScore(nextScore);
      setFeedback(`Basarili tur! +${gained} puan`);

      transitionTimerRef.current = window.setTimeout(() => {
        if (level >= MAX_LEVEL) {
          void finishGame({
            completed: true,
            remainingLives: lives,
            levelsCompleted: MAX_LEVEL,
            finalScoreOverride: nextScore,
          });
          return;
        }

        startLevel(level + 1);
      }, 900);

      return;
    }

    const nextLives = lives - 1;
    setLives(nextLives);
    setFeedback('Tur basarisiz. Ayni seviyeyi tekrar dene.');

    transitionTimerRef.current = window.setTimeout(() => {
      if (nextLives <= 0) {
        void finishGame({
          completed: false,
          remainingLives: 0,
          levelsCompleted: Math.max(0, level - 1),
          finalScoreOverride: score,
        });
        return;
      }

      startLevel(level);
    }, 900);
  }, [
    clearRoundAnimation,
    finishGame,
    items,
    level,
    lives,
    phase,
    roundLocked,
    roundTimeLeft,
    score,
    selectedIds,
    startLevel,
  ]);


  resolveRoundHandlerRef.current = resolveRound;

  const startGame = useCallback(() => {
    clearAllTimers();

    hasSavedRef.current = false;
    resolveRoundRef.current = false;
    setPhase('welcome');
    setScore(0);
    setLives(INITIAL_LIVES);
    setTimeLeft(durationSeconds);
    setTarget('-');
    setItems([]);
    setSelectedIds(new Set());
    setRoundDuration(0);
    setRoundTimeLeft(0);
    setRoundLocked(false);
    setFeedback(null);
    setRoundSummary(null);
    setSaveStatus(null);
    setIsSaving(false);

    startLevel(1);
  }, [clearAllTimers, durationSeconds, startLevel]);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'exposure') {
      return;
    }

    if (timeLeft <= 0) {
      void finishGame({
        completed: false,
        remainingLives: lives,
        levelsCompleted: Math.max(0, level - 1),
      });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [finishGame, level, lives, phase, timeLeft]);

  useEffect(() => {
    if (phase !== 'playing' || roundDuration <= 0) {
      return;
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      const remaining = Math.max(0, roundDuration - elapsed);
      setRoundTimeLeft(remaining);

      if (remaining <= 0) {
        roundAnimationRef.current = null;
        resolveRoundHandlerRef.current();
        return;
      }

      roundAnimationRef.current = window.requestAnimationFrame(tick);
    };

    roundAnimationRef.current = window.requestAnimationFrame(tick);

    return () => {
      clearRoundAnimation();
    };
  }, [clearRoundAnimation, phase, roundDuration, level, items.length]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const selectedCount = selectedIds.size;

  const roundProgress = useMemo(() => {
    if (roundDuration <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (roundTimeLeft / roundDuration) * 100));
  }, [roundDuration, roundTimeLeft]);

  const sessionProgress = useMemo(() => {
    if (durationSeconds <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (timeLeft / durationSeconds) * 100));
  }, [durationSeconds, timeLeft]);

  const columns = useMemo(() => {
    if (items.length >= 12) {
      return 4;
    }

    if (items.length >= 9) {
      return 3;
    }

    return 2;
  }, [items.length]);

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Hedef harfi veya heceyi iceren kartlari sec. Her turda zorluk artar, hata yaparsan can kaybedersin.
        </p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(durationSeconds / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Maksimum seviye: {MAX_LEVEL}</li>
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
      <div className="stack-sm">
        <h1>{gameTitle}</h1>
        <p className="muted">
          Hedef: <strong>{target}</strong> | Seviye: <strong>{level}</strong>/{MAX_LEVEL}
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          <div style={{ marginTop: '0.5rem' }}>
            <p className="muted" style={{ margin: 0 }}>
              Tur suresi
            </p>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: '#e2e8f0',
                overflow: 'hidden',
                marginTop: 4,
              }}
            >
              <div
                style={{
                  width: `${roundProgress}%`,
                  height: '100%',
                  background: '#2563eb',
                  transition: 'width 120ms linear',
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <p className="muted" style={{ margin: 0 }}>
              Oyun suresi
            </p>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: '#e2e8f0',
                overflow: 'hidden',
                marginTop: 4,
              }}
            >
              <div
                style={{
                  width: `${sessionProgress}%`,
                  height: '100%',
                  background: '#0f766e',
                  transition: 'width 250ms linear',
                }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Secim</h2>
          <p className="muted">Secilen kart: {selectedCount}</p>
          <p className="muted">
            Faz: {phase === 'exposure' ? 'Hazirlaniyor' : phase === 'playing' ? 'Oynaniyor' : 'Tamamlandi'}
          </p>
          {feedback ? <p>{feedback}</p> : <p className="muted">Hedefi iceren kartlari secip turu bitir.</p>}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button disabled={phase !== 'playing' || roundLocked} onClick={resolveRound}>
              Turu Bitir
            </Button>
            <Button
              variant="secondary"
              disabled={phase !== 'playing' || roundLocked || selectedCount === 0}
              onClick={() => setSelectedIds(new Set())}
            >
              Secimi Sifirla
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                finishGame({
                  completed: false,
                  remainingLives: lives,
                  levelsCompleted: Math.max(0, level - 1),
                })
              }
            >
              Bitir
            </Button>
          </div>
        </div>
      </div>

      {roundSummary ? (
        <div className="card">
          <h2 className="card-title">Tur Ozeti</h2>
          <p className="muted">
            Dogru secim: {roundSummary.correct}/{roundSummary.totalTargets}
          </p>
          <p className="muted">Yanlis secim: {roundSummary.falsePositives}</p>
          <p className="muted">Isabet: %{Math.round(roundSummary.accuracy * 100)}</p>
          <p className="muted">
            Sonuc: {roundSummary.success ? 'Basarili' : 'Basarisiz'}{' '}
            {roundSummary.success ? `(+${roundSummary.pointsGained})` : ''}
          </p>
        </div>
      ) : null}

      <div
        className="card"
        style={{
          opacity: phase === 'exposure' ? 0.65 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: '0.65rem',
          }}
        >
          {items.map((item) => {
            const selected = selectedIds.has(item.id);
            return (
              <button
                key={item.id}
                className="btn btn-ghost"
                disabled={phase !== 'playing' || roundLocked}
                onClick={() => {
                  setSelectedIds((previous) => {
                    const next = new Set(previous);
                    if (next.has(item.id)) {
                      next.delete(item.id);
                    } else {
                      next.add(item.id);
                    }
                    return next;
                  });
                }}
                style={{
                  minHeight: 56,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '1rem',
                  letterSpacing: '0.04em',
                  background: selected ? '#dbeafe' : undefined,
                  borderColor: selected ? '#2563eb' : undefined,
                }}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {phase === 'finished' ? (
        <div className="card stack-sm">
          <h2 className="card-title">Oyun Tamamlandi</h2>
          <p className="muted">Nihai skor: {score}</p>
          <p className="muted">Ulasilan seviye: {level}</p>
          {isSaving ? <p className="muted">Sonuc kaydediliyor...</p> : null}
          {saveStatus ? <p className="muted">{saveStatus}</p> : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <Button onClick={startGame}>Tekrar Oyna</Button>
            <Link className="btn btn-ghost" href="/games">
              Oyun listesine don
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
