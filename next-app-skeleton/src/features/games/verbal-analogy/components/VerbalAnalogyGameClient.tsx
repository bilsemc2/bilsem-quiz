'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface VerbalAnalogyGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface AnalogyQuestion {
  id: string;
  stemLeft: string;
  stemRight: string;
  promptLeft: string;
  answer: string;
  options: string[];
  explanation: string;
}

const QUESTION_BANK: AnalogyQuestion[] = [
  {
    id: 'a1',
    stemLeft: 'Ari',
    stemRight: 'Bal',
    promptLeft: 'Ipek bocegi',
    answer: 'Ipek',
    options: ['Yaprak', 'Kozalak', 'Ipek', 'Kovan'],
    explanation: 'Ureten-urun iliskisi.',
  },
  {
    id: 'a2',
    stemLeft: 'Yazar',
    stemRight: 'Kitap',
    promptLeft: 'Ressam',
    answer: 'Tablo',
    options: ['Firca', 'Muze', 'Tablo', 'Cerceve'],
    explanation: 'Ureten-eser iliskisi.',
  },
  {
    id: 'a3',
    stemLeft: 'Balik',
    stemRight: 'Solungac',
    promptLeft: 'Insan',
    answer: 'Akciger',
    options: ['Kalp', 'Akciger', 'Bobrek', 'Deri'],
    explanation: 'Canli-organ iliskisi.',
  },
  {
    id: 'a4',
    stemLeft: 'Saat',
    stemRight: 'Zaman',
    promptLeft: 'Termometre',
    answer: 'Sicaklik',
    options: ['Basinc', 'Hiz', 'Nem', 'Sicaklik'],
    explanation: 'Olcum araci-olculen buyukluk iliskisi.',
  },
  {
    id: 'a5',
    stemLeft: 'Makas',
    stemRight: 'Kesmek',
    promptLeft: 'Kalem',
    answer: 'Yazmak',
    options: ['Boyamak', 'Silmek', 'Yazmak', 'Taslamak'],
    explanation: 'Arac-islev iliskisi.',
  },
  {
    id: 'a6',
    stemLeft: 'Orman',
    stemRight: 'Agac',
    promptLeft: 'Kutuphane',
    answer: 'Kitap',
    options: ['Raf', 'Kitap', 'Masa', 'Lamba'],
    explanation: 'Butun-parca iliskisi.',
  },
  {
    id: 'a7',
    stemLeft: 'Kis',
    stemRight: 'Soguk',
    promptLeft: 'Yaz',
    answer: 'Sicak',
    options: ['Ruzgarli', 'Nemli', 'Sicak', 'Bulutlu'],
    explanation: 'Mevsim-ozellik iliskisi.',
  },
  {
    id: 'a8',
    stemLeft: 'Okul',
    stemRight: 'Ogrenci',
    promptLeft: 'Hastane',
    answer: 'Hasta',
    options: ['Doktor', 'Hasta', 'Ilac', 'Laboratuvar'],
    explanation: 'Mekan-temel kullanici iliskisi.',
  },
  {
    id: 'a9',
    stemLeft: 'Araba',
    stemRight: 'Direksiyon',
    promptLeft: 'Gemi',
    answer: 'Dumen',
    options: ['Pervane', 'Yelken', 'Dumen', 'Capa'],
    explanation: 'Arac-yonlendirme parcasi iliskisi.',
  },
  {
    id: 'a10',
    stemLeft: 'Asci',
    stemRight: 'Mutfak',
    promptLeft: 'Ogretmen',
    answer: 'Sinif',
    options: ['Tahta', 'Okul', 'Sinif', 'Defter'],
    explanation: 'Meslek-calisma ortami iliskisi.',
  },
  {
    id: 'a11',
    stemLeft: 'Tohum',
    stemRight: 'Bitki',
    promptLeft: 'Yumurta',
    answer: 'Kus',
    options: ['Yuva', 'Kus', 'Kanat', 'Tuy'],
    explanation: 'Baslangic formu-gelisim sonucu iliskisi.',
  },
  {
    id: 'a12',
    stemLeft: 'Kulak',
    stemRight: 'Isitme',
    promptLeft: 'Goz',
    answer: 'Gorme',
    options: ['Bakma', 'Renk', 'Gorme', 'Isik'],
    explanation: 'Duyu organi-duyu islevi iliskisi.',
  },
  {
    id: 'a13',
    stemLeft: 'Maden',
    stemRight: 'Kazma',
    promptLeft: 'Tarla',
    answer: 'Surme',
    options: ['Sulama', 'Surme', 'Budama', 'Ekme'],
    explanation: 'Alan-temel islem iliskisi.',
  },
  {
    id: 'a14',
    stemLeft: 'Satranc',
    stemRight: 'Zeka',
    promptLeft: 'Maraton',
    answer: 'Dayaniklilik',
    options: ['Hiz', 'Odul', 'Takim', 'Dayaniklilik'],
    explanation: 'Etkinlik-baskin beceri iliskisi.',
  },
  {
    id: 'a15',
    stemLeft: 'Mikroskop',
    stemRight: 'Kucuk',
    promptLeft: 'Teleskop',
    answer: 'Uzak',
    options: ['Parlak', 'Genis', 'Uzak', 'Hizli'],
    explanation: 'Arac-inceleme odagi iliskisi.',
  },
  {
    id: 'a16',
    stemLeft: 'Alev',
    stemRight: 'Yanma',
    promptLeft: 'Kar',
    answer: 'Donma',
    options: ['Erime', 'Buhar', 'Donma', 'Isinma'],
    explanation: 'Gozlenen durum-olay iliskisi.',
  },
  {
    id: 'a17',
    stemLeft: 'Ucak',
    stemRight: 'Pilot',
    promptLeft: 'Tren',
    answer: 'Makinist',
    options: ['Hostes', 'Yolcu', 'Makinist', 'Kondaktor'],
    explanation: 'Arac-kullanici meslek iliskisi.',
  },
  {
    id: 'a18',
    stemLeft: 'Roman',
    stemRight: 'Bolum',
    promptLeft: 'Film',
    answer: 'Sahne',
    options: ['Oyuncu', 'Sahne', 'Perde', 'Fragman'],
    explanation: 'Butun-alt birim iliskisi.',
  },
  {
    id: 'a19',
    stemLeft: 'Meyve',
    stemRight: 'Vitamin',
    promptLeft: 'Et',
    answer: 'Protein',
    options: ['Lif', 'Protein', 'Mineral', 'Seker'],
    explanation: 'Besin-baskin icerik iliskisi.',
  },
  {
    id: 'a20',
    stemLeft: 'Gazete',
    stemRight: 'Haber',
    promptLeft: 'Atlas',
    answer: 'Harita',
    options: ['Pusula', 'Kita', 'Harita', 'Yol'],
    explanation: 'Kaynak-icerik iliskisi.',
  },
];

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 12;
const MIN_DURATION_SECONDS = 150;

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function selectQuestions(count: number): AnalogyQuestion[] {
  return shuffle(QUESTION_BANK).slice(0, count).map((question) => ({
    ...question,
    options: shuffle(question.options),
  }));
}

export function VerbalAnalogyGameClient({ gameId, gameTitle, durationSeconds }: VerbalAnalogyGameClientProps) {
  const sessionSeconds = useMemo(
    () => Math.max(MIN_DURATION_SECONDS, Math.floor(durationSeconds)),
    [durationSeconds],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [questions, setQuestions] = useState<AnalogyQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(sessionSeconds);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
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
      const totalAnswered = correctCount + wrongCount;
      const accuracyPercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

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
            intelligenceType: 'sozel_muhakeme',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              questionsAnswered: totalAnswered,
              completed: params.completed,
              correctCount,
              wrongCount,
              accuracyPercent,
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
    [bestStreak, correctCount, gameId, sessionSeconds, timeLeft, wrongCount],
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
    hasSavedRef.current = false;
    setQuestions(selectQuestions(MAX_ROUNDS));
    setQuestionIndex(0);
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(sessionSeconds);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSelectedOption(null);
    setMessage('Iliskiyi bul ve dogru secenegi sec.');
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
    (option: string) => {
      if (phase !== 'playing' || selectedOption || questions.length === 0) {
        return;
      }

      const current = questions[questionIndex];
      if (!current) {
        return;
      }

      setSelectedOption(option);
      const isCorrect = option === current.answer;

      if (isCorrect) {
        const nextStreak = streak + 1;
        const gained = 95 + level * 7 + Math.min(45, streak * 6);
        const nextScore = score + gained;

        setScore(nextScore);
        setStreak(nextStreak);
        setBestStreak((previous) => Math.max(previous, nextStreak));
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru. +${gained} puan`);
      } else {
        setStreak(0);
        setWrongCount((previous) => previous + 1);
        setLives((previous) => previous - 1);
        setMessage(`Yanlis. Dogru cevap: ${current.answer}`);
      }

      window.setTimeout(() => {
        const nextIndex = questionIndex + 1;
        const nextLives = isCorrect ? lives : lives - 1;

        if (nextLives <= 0) {
          void finishGame({ completed: false, remainingLives: 0 });
          return;
        }

        if (nextIndex >= questions.length) {
          void finishGame({ completed: true, remainingLives: nextLives });
          return;
        }

        setQuestionIndex(nextIndex);
        setLevel(1 + Math.floor(nextIndex / 3));
        setSelectedOption(null);
      }, 900);
    },
    [finishGame, level, lives, phase, questionIndex, questions, score, selectedOption, streak],
  );

  const currentQuestion = questions[questionIndex];
  const totalAnswered = correctCount + wrongCount;
  const accuracyPercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 780 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Soru kalibini okuyup iki kelime arasindaki iliskiyi diger cifte aktar.</p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(sessionSeconds / 60)} dakika</li>
          <li>Soru sayisi: {MAX_ROUNDS}</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
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
          <div className="muted">Soru</div>
          <strong>
            {Math.min(questionIndex + 1, questions.length || MAX_ROUNDS)} / {questions.length || MAX_ROUNDS}
          </strong>
        </div>
        <div>
          <div className="muted">Seviye</div>
          <strong>{level}</strong>
        </div>
        <div>
          <div className="muted">Seri</div>
          <strong>{streak}</strong>
        </div>
        <div>
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'playing' && currentQuestion ? (
        <div className="card stack" style={{ gap: '0.9rem' }}>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '0.9rem',
              background: 'rgba(15, 23, 42, 0.03)',
              fontWeight: 700,
              fontSize: '1.04rem',
            }}
          >
            {`${currentQuestion.stemLeft} : ${currentQuestion.stemRight} = ${currentQuestion.promptLeft} : ?`}
          </div>

          <div className="grid-2">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.answer;

              const background =
                selectedOption === null
                  ? 'var(--surface)'
                  : isCorrect
                    ? 'rgba(34, 197, 94, 0.22)'
                    : isSelected
                      ? 'rgba(239, 68, 68, 0.22)'
                      : 'var(--surface)';

              return (
                <button
                  key={`${currentQuestion.id}-${option}`}
                  type="button"
                  className="btn"
                  onClick={() => handleAnswer(option)}
                  disabled={selectedOption !== null}
                  style={{
                    minHeight: 48,
                    fontWeight: 700,
                    borderColor: 'var(--border)',
                    background,
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {selectedOption ? (
            <p className="muted" style={{ margin: 0 }}>
              {currentQuestion.explanation}
            </p>
          ) : null}
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
            <li>Dogru sayisi: {correctCount}</li>
            <li>Yanlis sayisi: {wrongCount}</li>
            <li>Dogruluk: %{accuracyPercent}</li>
            <li>En iyi seri: {bestStreak}</li>
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
