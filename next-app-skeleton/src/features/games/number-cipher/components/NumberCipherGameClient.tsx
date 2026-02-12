'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type PuzzleType = 'hidden_operator' | 'pair_relation' | 'conditional' | 'multi_rule';

interface NumberCipherGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface RoundData {
  puzzleType: PuzzleType;
  promptLines: string[];
  question: string;
  answer: number;
  options: number[];
  clue: string;
}

interface OperatorRule {
  symbol: '+' | '-' | 'x';
  run: (a: number, b: number) => number;
  clue: string;
}

interface PairRule {
  clue: string;
  run: (a: number, b: number) => number;
}

interface ConditionalRule {
  clue: string;
  run: (n: number) => number;
  examples: number[];
  questions: number[];
}

const INITIAL_LIVES = 5;
const MAX_ROUNDS = 22;
const MIN_DURATION_SECONDS = 150;

const OPERATOR_RULES: OperatorRule[] = [
  { symbol: '+', run: (a, b) => a + b, clue: 'Gizli islem toplama' },
  { symbol: '-', run: (a, b) => a - b, clue: 'Gizli islem cikarma' },
  { symbol: 'x', run: (a, b) => a * b, clue: 'Gizli islem carpma' },
];

const PAIR_RULES: PairRule[] = [
  { clue: 'Kural: A + B', run: (a, b) => a + b },
  { clue: 'Kural: A x B', run: (a, b) => a * b },
  { clue: 'Kural: A^2 + B', run: (a, b) => a * a + b },
  { clue: 'Kural: 2A + B', run: (a, b) => 2 * a + b },
];

const CONDITIONAL_RULES: ConditionalRule[] = [
  {
    clue: 'Tek +3, cift -2',
    run: (n) => (n % 2 === 1 ? n + 3 : n - 2),
    examples: [3, 8, 5],
    questions: [2, 7, 10],
  },
  {
    clue: '<6 ise x2, >=6 ise +4',
    run: (n) => (n < 6 ? n * 2 : n + 4),
    examples: [2, 7, 4],
    questions: [9, 5, 1],
  },
  {
    clue: '3un katiysa /3, degilse +2',
    run: (n) => (n % 3 === 0 ? Math.floor(n / 3) : n + 2),
    examples: [6, 5, 9],
    questions: [4, 12, 7],
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function createNumericOptions(answer: number, level: number): number[] {
  const options = new Set<number>([answer]);
  let guard = 0;

  while (options.size < 4 && guard < 240) {
    const delta = randomInt(1, 5 + Math.floor(level / 2));
    const sign = Math.random() < 0.5 ? -1 : 1;
    const candidate = answer + sign * delta;

    if (candidate >= 0) {
      options.add(candidate);
    }

    guard += 1;
  }

  while (options.size < 4) {
    options.add(answer + options.size * 3 + 1);
  }

  return shuffle(Array.from(options));
}

function createHiddenOperatorRound(level: number): RoundData {
  const available = level <= 5 ? OPERATOR_RULES.slice(0, 2) : OPERATOR_RULES;
  const rule = available[randomInt(0, available.length - 1)] ?? OPERATOR_RULES[0];

  const upper = Math.min(12, 6 + level);
  const a = randomInt(1, upper);
  const b = randomInt(1, upper);
  const c = randomInt(1, upper);
  const d = randomInt(1, upper);
  const e = randomInt(1, upper);
  const f = randomInt(1, upper);

  const lineOne = `${a} ? ${b} = ${rule.run(a, b)}`;
  const lineTwo = `${c} ? ${d} = ${rule.run(c, d)}`;
  const answer = rule.run(e, f);

  return {
    puzzleType: 'hidden_operator',
    promptLines: [lineOne, lineTwo],
    question: `${e} ? ${f} = ?`,
    answer,
    options: createNumericOptions(answer, level),
    clue: rule.clue,
  };
}

function createPairRelationRound(level: number): RoundData {
  const available = level <= 8 ? PAIR_RULES.slice(0, 3) : PAIR_RULES;
  const rule = available[randomInt(0, available.length - 1)] ?? PAIR_RULES[0];

  const upperA = Math.min(10, 5 + Math.floor(level / 2));
  const upperB = Math.min(9, 5 + Math.floor(level / 3));

  const exampleA1 = randomInt(2, upperA);
  const exampleB1 = randomInt(1, upperB);
  const exampleA2 = randomInt(2, upperA);
  const exampleB2 = randomInt(1, upperB);
  const queryA = randomInt(2, upperA);
  const queryB = randomInt(1, upperB);

  const lineOne = `(${exampleA1}, ${exampleB1}) -> ${rule.run(exampleA1, exampleB1)}`;
  const lineTwo = `(${exampleA2}, ${exampleB2}) -> ${rule.run(exampleA2, exampleB2)}`;
  const answer = rule.run(queryA, queryB);

  return {
    puzzleType: 'pair_relation',
    promptLines: [lineOne, lineTwo],
    question: `(${queryA}, ${queryB}) -> ?`,
    answer,
    options: createNumericOptions(answer, level),
    clue: rule.clue,
  };
}

function createConditionalRound(level: number): RoundData {
  const rule = CONDITIONAL_RULES[randomInt(0, CONDITIONAL_RULES.length - 1)] ?? CONDITIONAL_RULES[0];
  const questionInput = rule.questions[randomInt(0, rule.questions.length - 1)] ?? rule.questions[0] ?? 4;

  const promptLines = rule.examples.map((example) => `${example} -> ${rule.run(example)}`);
  const answer = rule.run(questionInput);

  return {
    puzzleType: 'conditional',
    promptLines,
    question: `${questionInput} -> ?`,
    answer,
    options: createNumericOptions(answer, level),
    clue: rule.clue,
  };
}

function createMultiRuleRound(level: number): RoundData {
  const rules: PairRule[] = [
    { clue: 'Kural: A x B + A', run: (a, b) => a * b + a },
    { clue: 'Kural: (A + B) x 2', run: (a, b) => (a + b) * 2 },
    { clue: 'Kural: A^2 - B', run: (a, b) => a * a - b },
  ];

  const rule = rules[randomInt(0, rules.length - 1)] ?? rules[0];
  const upper = Math.min(10, 5 + Math.floor(level / 2));

  const exampleA1 = randomInt(2, upper);
  const exampleB1 = randomInt(1, upper - 1);
  const exampleA2 = randomInt(2, upper);
  const exampleB2 = randomInt(1, upper - 1);
  const queryA = randomInt(2, upper);
  const queryB = randomInt(1, upper - 1);

  const lineOne = `A=${exampleA1}, B=${exampleB1} -> ${rule.run(exampleA1, exampleB1)}`;
  const lineTwo = `A=${exampleA2}, B=${exampleB2} -> ${rule.run(exampleA2, exampleB2)}`;
  const answer = rule.run(queryA, queryB);

  return {
    puzzleType: 'multi_rule',
    promptLines: [lineOne, lineTwo],
    question: `A=${queryA}, B=${queryB} -> ?`,
    answer,
    options: createNumericOptions(answer, level),
    clue: rule.clue,
  };
}

function createRound(level: number): RoundData {
  if (level <= 5) {
    return createHiddenOperatorRound(level);
  }

  if (level <= 10) {
    return createPairRelationRound(level);
  }

  if (level <= 15) {
    return createConditionalRound(level);
  }

  return Math.random() < 0.55 ? createConditionalRound(level) : createMultiRuleRound(level);
}

export function NumberCipherGameClient({ gameId, gameTitle, durationSeconds }: NumberCipherGameClientProps) {
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
  const [round, setRound] = useState<RoundData | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);

  const persistResult = useCallback(
    async (params: {
      finalScore: number;
      remainingLives: number;
      completed: boolean;
      levelReached: number;
      lastPuzzleType: PuzzleType | null;
    }) => {
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
            intelligenceType: 'mantiksal_muhakeme',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              correctCount,
              totalAttempts,
              accuracyPercent,
              lastPuzzleType: params.lastPuzzleType,
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
    [correctCount, gameId, roundIndex, sessionSeconds, timeLeft, totalAttempts],
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
        lastPuzzleType: round?.puzzleType ?? null,
      });
    },
    [level, persistResult, round?.puzzleType, score],
  );

  const startGame = useCallback(() => {
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setRoundIndex(1);
    setTimeLeft(sessionSeconds);
    setRound(createRound(1));
    setCorrectCount(0);
    setTotalAttempts(0);
    setMessage('Orneklerden kurali bul ve dogru sonucu sec.');
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

  const handleAnswer = useCallback(
    (choice: number) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const isCorrect = choice === round.answer;
      const nextAttempts = totalAttempts + 1;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);

      setTotalAttempts(nextAttempts);

      if (isCorrect) {
        const gained = 11 + level * 2;
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru kural. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        setRoundIndex(nextRoundIndex);
        setLevel(nextLevel);
        setRound(createRound(nextLevel));
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setMessage(`Yanlis cevap. Dogru sonuc: ${round.answer}`);

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
      setRound(createRound(nextLevel));
    },
    [finishGame, level, lives, phase, round, roundIndex, score, totalAttempts],
  );

  const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Sayi iliskilerini cozumleyip kurali bul ve eksik sonucu sec.</p>
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
      <div className="card" style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
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
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'playing' && round ? (
        <>
          <div className="card stack" style={{ gap: '0.95rem' }}>
            <div>
              <strong>Seviye {level}</strong>
              <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                {round.clue}
              </p>
            </div>

            <div className="stack" style={{ gap: '0.6rem' }}>
              {round.promptLines.map((line, index) => (
                <div
                  key={`${line}-${index}`}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '0.7rem 0.8rem',
                    background: 'rgba(15, 23, 42, 0.02)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            <div
              style={{
                border: '1px dashed var(--border)',
                borderRadius: 10,
                padding: '0.75rem 0.8rem',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.02rem',
              }}
            >
              {round.question}
            </div>

            <div className="grid-2">
              {round.options.map((option) => (
                <Button key={option} onClick={() => handleAnswer(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {message ? (
            <p className="muted" style={{ marginTop: '-0.2rem' }}>
              {message}
            </p>
          ) : null}
        </>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack" style={{ gap: '0.8rem' }}>
          <h2 style={{ margin: 0 }}>Oyun Tamamlandi</h2>
          <p className="muted" style={{ margin: 0 }}>
            Sure doldu, turler tamamlandi veya canin bitti.
          </p>
          <ul className="muted" style={{ margin: 0 }}>
            <li>Skor: {score}</li>
            <li>Dogru cevap: {correctCount}</li>
            <li>Toplam deneme: {totalAttempts}</li>
            <li>Dogruluk: %{accuracyPercent}</li>
            <li>Seviye: {level}</li>
          </ul>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={startGame}>Tekrar Oyna</Button>
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
