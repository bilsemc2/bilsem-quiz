'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'memorize' | 'question' | 'finished';
type QuestionType = 'token_from_color' | 'color_from_token';

interface SymbolMatchGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface TokenInfo {
  id: string;
  glyph: string;
  label: string;
}

interface ColorInfo {
  hex: string;
  name: string;
}

interface SymbolColorPair {
  token: TokenInfo;
  color: ColorInfo;
}

interface RoundData {
  pairs: SymbolColorPair[];
  questionType: QuestionType;
  prompt: string;
  correctAnswer: string;
  options: string[];
  memorizeSeconds: number;
}

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 18;
const MIN_DURATION_SECONDS = 150;

const TOKENS: TokenInfo[] = [
  { id: 'star', glyph: '*', label: 'Yildiz' },
  { id: 'tri', glyph: '/\\', label: 'Ucgen' },
  { id: 'box', glyph: '[]', label: 'Kare' },
  { id: 'dot', glyph: 'O', label: 'Daire' },
  { id: 'diamond', glyph: '<>', label: 'Elmas' },
  { id: 'hex', glyph: 'HEX', label: 'Altigen' },
];

const COLORS: ColorInfo[] = [
  { hex: '#ef4444', name: 'Kirmizi' },
  { hex: '#3b82f6', name: 'Mavi' },
  { hex: '#22c55e', name: 'Yesil' },
  { hex: '#f59e0b', name: 'Sari' },
  { hex: '#a855f7', name: 'Mor' },
  { hex: '#ec4899', name: 'Pembe' },
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

function pairCountForLevel(level: number): number {
  if (level <= 3) {
    return 4;
  }

  if (level <= 7) {
    return 5;
  }

  return 6;
}

function memorizeSecondsForLevel(level: number): number {
  if (level <= 2) {
    return 5;
  }

  if (level <= 5) {
    return 4;
  }

  if (level <= 8) {
    return 3;
  }

  return 2;
}

function createRound(level: number): RoundData {
  const count = pairCountForLevel(level);
  const tokens = shuffle(TOKENS).slice(0, count);
  const colors = shuffle(COLORS).slice(0, count);

  const pairs = tokens.map((token, index) => ({
    token,
    color: colors[index] ?? COLORS[0],
  }));

  const target = pairs[randomInt(0, pairs.length - 1)] ?? pairs[0];
  const questionType: QuestionType = Math.random() < 0.5 ? 'token_from_color' : 'color_from_token';

  if (!target) {
    return {
      pairs: [],
      questionType: 'token_from_color',
      prompt: 'Soru hazirlanamadi',
      correctAnswer: '',
      options: [],
      memorizeSeconds: memorizeSecondsForLevel(level),
    };
  }

  if (questionType === 'token_from_color') {
    const wrong = pairs.filter((pair) => pair.token.id !== target.token.id).map((pair) => pair.token.label);
    const options = shuffle([target.token.label, ...wrong.slice(0, 3)]);

    return {
      pairs,
      questionType,
      prompt: `${target.color.name} renkteki sekil hangisiydi?`,
      correctAnswer: target.token.label,
      options,
      memorizeSeconds: memorizeSecondsForLevel(level),
    };
  }

  const wrong = pairs.filter((pair) => pair.token.id !== target.token.id).map((pair) => pair.color.name);
  const options = shuffle([target.color.name, ...wrong.slice(0, 3)]);

  return {
    pairs,
    questionType,
    prompt: `${target.token.label} hangi renkteydi?`,
    correctAnswer: target.color.name,
    options,
    memorizeSeconds: memorizeSecondsForLevel(level),
  };
}

export function SymbolMatchGameClient({ gameId, gameTitle, durationSeconds }: SymbolMatchGameClientProps) {
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
  const [memorizeLeft, setMemorizeLeft] = useState(0);
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
      lastQuestionType: QuestionType | null;
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
            intelligenceType: 'gorsel_calisma_bellek',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              correctCount,
              totalAttempts,
              accuracyPercent,
              lastQuestionType: params.lastQuestionType,
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
        lastQuestionType: round?.questionType ?? null,
      });
    },
    [level, persistResult, round?.questionType, score],
  );

  const startRound = useCallback((nextLevel: number, nextRoundIndex: number) => {
    const nextRound = createRound(nextLevel);

    setLevel(nextLevel);
    setRoundIndex(nextRoundIndex);
    setRound(nextRound);
    setMemorizeLeft(nextRound.memorizeSeconds);
    setPhase('memorize');
  }, []);

  const startGame = useCallback(() => {
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setCorrectCount(0);
    setTotalAttempts(0);
    setTimeLeft(sessionSeconds);
    setMessage('Renk-sekil eslesmelerini ezberle ve dogru cevabi sec.');
    setSaveStatus(null);
    setIsSaving(false);
    startRound(1, 1);
  }, [sessionSeconds, startRound]);

  useEffect(() => {
    setTimeLeft(sessionSeconds);
  }, [sessionSeconds]);

  useEffect(() => {
    if (phase !== 'memorize' && phase !== 'question') {
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

  useEffect(() => {
    if (phase !== 'memorize') {
      return;
    }

    if (memorizeLeft <= 0) {
      setPhase('question');
      return;
    }

    const timerId = window.setTimeout(() => {
      setMemorizeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [memorizeLeft, phase]);

  const handleAnswer = useCallback(
    (choice: string) => {
      if (phase !== 'question' || !round) {
        return;
      }

      const isCorrect = choice === round.correctAnswer;
      const nextAttempts = totalAttempts + 1;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 3);

      setTotalAttempts(nextAttempts);

      if (isCorrect) {
        const gained = 12 + level * 2;
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru cevap. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        startRound(nextLevel, nextRoundIndex);
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setMessage(`Yanlis cevap. Dogru cevap: ${round.correctAnswer}`);

      if (nextLives <= 0) {
        void finishGame({ completed: false, remainingLives: 0 });
        return;
      }

      if (nextRoundIndex > MAX_ROUNDS) {
        void finishGame({ completed: true, remainingLives: nextLives });
        return;
      }

      startRound(nextLevel, nextRoundIndex);
    },
    [finishGame, level, lives, phase, round, roundIndex, score, startRound, totalAttempts],
  );

  const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Renkli sekil-kod eslesmelerini ezberle, sonra soruya dogru cevap ver.</p>
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
    <div className="stack" style={{ maxWidth: 880 }}>
      <div className="card" style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
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
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'memorize' && round ? (
        <div className="card stack">
          <strong>Ezberleme Asamasi</strong>
          <p className="muted" style={{ margin: 0 }}>
            Kalan sure: {memorizeLeft} sn
          </p>
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            {round.pairs.map((pair) => (
              <div
                key={pair.token.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '0.7rem 0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.02)',
                }}
              >
                <span style={{ fontWeight: 700 }}>{pair.token.glyph}</span>
                <span style={{ color: pair.color.hex, fontWeight: 700 }}>{pair.color.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {phase === 'question' && round ? (
        <div className="card stack" style={{ gap: '0.9rem' }}>
          <strong>Soru</strong>
          <p style={{ margin: 0 }}>{round.prompt}</p>
          <div className="grid-2">
            {round.options.map((option) => (
              <Button key={option} onClick={() => handleAnswer(option)}>
                {option}
              </Button>
            ))}
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
