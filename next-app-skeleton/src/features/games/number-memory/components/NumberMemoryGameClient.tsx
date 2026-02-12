'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'sequence' | 'question' | 'feedback' | 'finished';
type QuestionType = 'number' | 'order';

interface MemoryQuestion {
  text: string;
  answer: number | string;
  options: Array<number | string>;
  type: QuestionType;
}

interface NumberMemoryGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface FinishGameOptions {
  completed: boolean;
  remainingLives: number;
  levelsCompleted: number;
  finalScoreOverride?: number;
}

const INITIAL_LIVES = 5;
const MAX_LEVEL = 20;
const STEP_DURATION_MS = 900;

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSequenceLength(level: number): number {
  return Math.min(3 + Math.floor(level / 4), 7);
}

function generateSequence(level: number): number[] {
  const length = getSequenceLength(level);
  return Array.from({ length }, () => getRandomInt(0, 9));
}

function makeNumericOptions(answer: number, min: number, max: number): number[] {
  const options = new Set<number>([answer]);
  let guard = 0;

  while (options.size < 4 && guard < 60) {
    options.add(getRandomInt(min, max));
    guard += 1;
  }

  for (let value = min; value <= max && options.size < 4; value += 1) {
    options.add(value);
  }

  return shuffle(Array.from(options).slice(0, 4));
}

function createQuestion(sequence: number[]): MemoryQuestion {
  const builders: Array<() => MemoryQuestion | null> = [
    () => {
      const index = getRandomInt(0, sequence.length - 1);
      const answer = sequence[index];
      return {
        text: `${index + 1}. soylenen rakam hangisiydi?`,
        answer,
        options: makeNumericOptions(answer, 0, 9),
        type: 'number',
      };
    },
    () => {
      if (sequence.length < 2) {
        return null;
      }

      const first = getRandomInt(0, sequence.length - 1);
      let second = getRandomInt(0, sequence.length - 1);
      if (first === second) {
        second = (second + 1) % sequence.length;
      }

      const answer = sequence[first] + sequence[second];
      return {
        text: `${first + 1}. ve ${second + 1}. rakamlarin toplami kac?`,
        answer,
        options: makeNumericOptions(answer, 0, 18),
        type: 'number',
      };
    },
    () => {
      const forward = sequence.join(' - ');
      const options = new Set<string>([forward]);
      let guard = 0;

      while (options.size < 4 && guard < 30) {
        options.add(shuffle(sequence).join(' - '));
        guard += 1;
      }

      return {
        text: 'Rakamlar hangi sirayla soylendi?',
        answer: forward,
        options: shuffle(Array.from(options).slice(0, 4)),
        type: 'order',
      };
    },
    () => {
      const answer = Math.max(...sequence);
      return {
        text: 'Soylenen rakamlardan en buyugu hangisiydi?',
        answer,
        options: makeNumericOptions(answer, 0, 9),
        type: 'number',
      };
    },
  ];

  let question: MemoryQuestion | null = null;
  let guard = 0;

  while (!question && guard < 12) {
    question = pick(builders)();
    guard += 1;
  }

  return (
    question ?? {
      text: '1. soylenen rakam hangisiydi?',
      answer: sequence[0] ?? 0,
      options: makeNumericOptions(sequence[0] ?? 0, 0, 9),
      type: 'number',
    }
  );
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function NumberMemoryGameClient({ gameId, gameTitle, durationSeconds }: NumberMemoryGameClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [sequence, setSequence] = useState<number[]>([]);
  const [sequenceStep, setSequenceStep] = useState(0);
  const [question, setQuestion] = useState<MemoryQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [roundMessage, setRoundMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const sequenceTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const clearSequenceTimer = useCallback(() => {
    if (sequenceTimerRef.current !== null) {
      window.clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const clearRoundTimers = useCallback(() => {
    clearSequenceTimer();
    clearFeedbackTimer();
  }, [clearFeedbackTimer, clearSequenceTimer]);

  useEffect(() => {
    return () => {
      clearRoundTimers();
    };
  }, [clearRoundTimers]);

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
            intelligenceType: 'sayisal_hafiza',
            metadata: {
              completed: params.completed,
              levelsCompleted: params.levelsCompleted,
              sequenceLength: sequence.length,
              source: 'number-memory-migrated',
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
    [durationSeconds, gameId, sequence.length, timeLeft],
  );

  const finishGame = useCallback(
    async ({ completed, remainingLives, levelsCompleted, finalScoreOverride }: FinishGameOptions) => {
      clearRoundTimers();
      setPhase('finished');

      const completionBonus = completed ? 200 : 0;
      const baseScore = finalScoreOverride ?? score;
      const finalScore = baseScore + (finalScoreOverride === undefined ? completionBonus : 0);

      if (finalScore !== score) {
        setScore(finalScore);
      }

      await persistResult({
        finalScore,
        remainingLives,
        completed,
        levelsCompleted,
      });
    },
    [clearRoundTimers, persistResult, score],
  );

  const startLevel = useCallback(
    (nextLevel: number) => {
      clearRoundTimers();

      const nextSequence = generateSequence(nextLevel);
      setLevel(nextLevel);
      setSequence(nextSequence);
      setSequenceStep(0);
      setQuestion(null);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setRoundMessage('Rakamlari dikkatle izle.');
      setPhase('sequence');
    },
    [clearRoundTimers],
  );

  const startGame = useCallback(() => {
    clearRoundTimers();

    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(durationSeconds);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setRoundMessage(null);
    setIsSaving(false);
    setSaveStatus(null);
    startLevel(1);
  }, [clearRoundTimers, durationSeconds, startLevel]);

  const replaySequence = useCallback(() => {
    if (phase !== 'question') {
      return;
    }

    clearRoundTimers();
    setQuestion(null);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setSequenceStep(0);
    setRoundMessage('Sekans tekrar oynatiliyor.');
    setPhase('sequence');
  }, [clearRoundTimers, phase]);

  useEffect(() => {
    if (phase !== 'sequence') {
      return;
    }

    if (sequence.length === 0) {
      return;
    }

    if (sequenceStep >= sequence.length) {
      clearSequenceTimer();
      sequenceTimerRef.current = window.setTimeout(() => {
        setQuestion(createQuestion(sequence));
        setSelectedAnswer(null);
        setIsCorrect(null);
        setRoundMessage('Soruyu cevapla.');
        setPhase('question');
      }, 500);
      return;
    }

    clearSequenceTimer();
    sequenceTimerRef.current = window.setTimeout(() => {
      setSequenceStep((previous) => previous + 1);
    }, STEP_DURATION_MS);
  }, [clearSequenceTimer, phase, sequence, sequenceStep]);

  useEffect(() => {
    if (phase !== 'sequence' && phase !== 'question' && phase !== 'feedback') {
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

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, level, lives, phase, timeLeft]);

  const handleAnswer = useCallback(
    (answer: number | string) => {
      if (phase !== 'question' || !question || selectedAnswer !== null) {
        return;
      }

      const correct = answer === question.answer;
      setSelectedAnswer(answer);
      setIsCorrect(correct);
      setPhase('feedback');

      clearFeedbackTimer();

      if (correct) {
        const gained = 10 * level;
        const nextScore = score + gained;

        setScore(nextScore);
        setRoundMessage(`Dogrusu! +${gained} puan`);

        feedbackTimerRef.current = window.setTimeout(() => {
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
        }, 1000);

        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setRoundMessage(`Yanlis. Dogru cevap: ${question.answer}`);

      feedbackTimerRef.current = window.setTimeout(() => {
        if (nextLives <= 0) {
          void finishGame({
            completed: false,
            remainingLives: 0,
            levelsCompleted: Math.max(0, level - 1),
          });
          return;
        }

        startLevel(level);
      }, 1000);
    },
    [clearFeedbackTimer, finishGame, level, lives, phase, question, score, selectedAnswer, startLevel],
  );

  const sequenceProgress = useMemo(() => {
    if (sequence.length === 0) {
      return 0;
    }

    const current = Math.min(sequenceStep, sequence.length);
    return Math.round((current / sequence.length) * 100);
  }, [sequence.length, sequenceStep]);

  const visibleDigit =
    phase === 'sequence' && sequenceStep < sequence.length ? sequence[sequenceStep] : null;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Sayi dizisini hatirla ve sorulari cevapla. Seviye yukseldikce dizi uzar ve soru zorlugu artar.
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
    <div className="stack" style={{ maxWidth: 920 }}>
      <div className="stack-sm">
        <h1>{gameTitle}</h1>
        <p className="muted">
          Faz:{' '}
          {phase === 'sequence'
            ? 'Dizi Gosterimi'
            : phase === 'question'
              ? 'Soru'
              : phase === 'feedback'
                ? 'Geri Bildirim'
                : 'Tamamlandi'}
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          {roundMessage ? <p>{roundMessage}</p> : <p className="muted">Dikkatini topla.</p>}
        </div>

        <div className="card">
          <h2 className="card-title">Kontrol</h2>
          <p className="muted">Sekans uzunlugu: {sequence.length}</p>
          <p className="muted">Tamamlanma: %{sequenceProgress}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button variant="secondary" disabled={phase !== 'question'} onClick={replaySequence}>
              Sekansi Tekrar Oynat
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

      {phase === 'sequence' ? (
        <div className="card stack-sm" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h2 className="card-title">Sekansi Izle</h2>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 18,
              border: '2px solid #2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 800,
              background: '#eff6ff',
              color: '#1e3a8a',
            }}
          >
            {visibleDigit ?? '-'}
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {Math.min(sequenceStep + 1, sequence.length)} / {sequence.length}
          </p>
        </div>
      ) : null}

      {(phase === 'question' || phase === 'feedback') && question ? (
        <div className="card stack-sm">
          <h2 className="card-title">{question.text}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: question.type === 'order' ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              gap: '0.6rem',
            }}
          >
            {question.options.map((option, index) => {
              const selected = selectedAnswer === option;
              const correctOption = option === question.answer;
              const revealCorrect = phase === 'feedback' && correctOption;
              const revealWrong = phase === 'feedback' && selected && !correctOption;

              return (
                <button
                  key={`${String(option)}-${index}`}
                  className="btn btn-secondary"
                  disabled={phase === 'feedback'}
                  onClick={() => handleAnswer(option)}
                  style={{
                    minHeight: question.type === 'order' ? 54 : 68,
                    fontSize: question.type === 'order' ? '1rem' : '1.35rem',
                    fontWeight: 700,
                    borderColor: revealCorrect ? '#16a34a' : revealWrong ? '#dc2626' : '#cbd5e1',
                    borderWidth: revealCorrect || revealWrong ? 2 : 1,
                    background: revealCorrect ? '#dcfce7' : revealWrong ? '#fee2e2' : '#f1f5f9',
                    color: '#0f172a',
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {phase === 'feedback' && isCorrect !== null ? (
            <p className="muted">{isCorrect ? 'Cevabin dogru.' : 'Bu turde puan kazanilamadi.'}</p>
          ) : null}
        </div>
      ) : null}

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
