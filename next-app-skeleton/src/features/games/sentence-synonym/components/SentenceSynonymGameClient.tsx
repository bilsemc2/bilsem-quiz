'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface SentenceSynonymGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface SentenceQuestion {
  id: string;
  sentence: string;
  focusWord: string;
  answer: string;
  options: string[];
  hint: string;
}

const QUESTION_BANK: SentenceQuestion[] = [
  {
    id: 'cs1',
    sentence: 'Bu melodinin ritmi tum salona nese yaydi.',
    focusWord: 'nese',
    answer: 'sevinc',
    options: ['sevinc', 'uzuntu', 'suskunluk', 'endise'],
    hint: 'Olumlu duygu ifadesi.',
  },
  {
    id: 'cs2',
    sentence: 'Kaptan firtina cikmadan once tum ekibi ikaz etti.',
    focusWord: 'ikaz',
    answer: 'uyari',
    options: ['uyari', 'kutlama', 'saka', 'sorusturma'],
    hint: 'Tehlikeye karsi haber verme.',
  },
  {
    id: 'cs3',
    sentence: 'Bahcedeki fidanlar bu yil oldukca serpilmis.',
    focusWord: 'serpilmis',
    answer: 'gelismis',
    options: ['gelismis', 'kurumus', 'saklanmis', 'dagitilmis'],
    hint: 'Buyume ve canlanma anlami.',
  },
  {
    id: 'cs4',
    sentence: 'Rehber zor etapta herkese sabir tavsiye etti.',
    focusWord: 'sabir',
    answer: 'dayanma',
    options: ['dayanma', 'acele', 'unutma', 'cekinme'],
    hint: 'Bekleyebilme becerisi.',
  },
  {
    id: 'cs5',
    sentence: 'Antrenor final oncesi takima moral verdi.',
    focusWord: 'moral',
    answer: 'motivasyon',
    options: ['motivasyon', 'ceza', 'itiraz', 'kararsizlik'],
    hint: 'Istek ve guc kazandirma.',
  },
  {
    id: 'cs6',
    sentence: 'Muzedeki bu eser gercekten nadide bir parcaydi.',
    focusWord: 'nadide',
    answer: 'degerli',
    options: ['degerli', 'siradan', 'kirik', 'gecici'],
    hint: 'Az bulunan ve kiymetli.',
  },
  {
    id: 'cs7',
    sentence: 'Yarisma sonunda kazanan ekibe odul takdim edildi.',
    focusWord: 'takdim',
    answer: 'sunum',
    options: ['sunum', 'saklama', 'erteleme', 'karistirma'],
    hint: 'Bir seyi verme veya sunma eylemi.',
  },
  {
    id: 'cs8',
    sentence: 'Bilim kulubu bu ay yeni bir proje tasarladi.',
    focusWord: 'tasarladi',
    answer: 'planladi',
    options: ['planladi', 'yikti', 'sakladi', 'uzatti'],
    hint: 'Onceden duzenleme dusuncesi.',
  },
  {
    id: 'cs9',
    sentence: 'Kutuphanedeki sessizlik calismayi kolaylastirdi.',
    focusWord: 'sessizlik',
    answer: 'sukunet',
    options: ['sukunet', 'gurultu', 'hareket', 'panik'],
    hint: 'Sakin ve sessiz ortam.',
  },
  {
    id: 'cs10',
    sentence: 'Takim kaptani zor anda sogukkanli davrandi.',
    focusWord: 'sogukkanli',
    answer: 'sakin',
    options: ['sakin', 'sinirli', 'aceleci', 'daginik'],
    hint: 'Panik yapmama hali.',
  },
  {
    id: 'cs11',
    sentence: 'Mimar eski yapinin ozgun detaylarini korudu.',
    focusWord: 'ozgun',
    answer: 'kendine-ozgu',
    options: ['kendine-ozgu', 'taklit', 'pasli', 'sade'],
    hint: 'Benzeri olmayan nitelik.',
  },
  {
    id: 'cs12',
    sentence: 'Arastirma grubu verileri titizlikle inceledi.',
    focusWord: 'titizlikle',
    answer: 'ozenle',
    options: ['ozenle', 'rastgele', 'hizla', 'sessizce'],
    hint: 'Dikkatli ve ayrintili bicim.',
  },
  {
    id: 'cs13',
    sentence: 'Yazar bu bolumde olaylari gayet acik anlatti.',
    focusWord: 'acik',
    answer: 'net',
    options: ['net', 'karisik', 'kapali', 'baskin'],
    hint: 'Belirsizlik icermeyen durum.',
  },
  {
    id: 'cs14',
    sentence: 'Ogretmen cevabi dogru bulan ogrenciyi tebrik etti.',
    focusWord: 'tebrik',
    answer: 'kutlama',
    options: ['kutlama', 'uyarma', 'elestiri', 'itiraz'],
    hint: 'Basariyi olumlu sozle belirtme.',
  },
  {
    id: 'cs15',
    sentence: 'Sporcular isinma hareketlerini aksatmadan yapti.',
    focusWord: 'aksatmadan',
    answer: 'duzenli',
    options: ['duzenli', 'eksik', 'plansiz', 'hizsiz'],
    hint: 'Atlamadan surdurme anlami.',
  },
  {
    id: 'cs16',
    sentence: 'Bu kampanya ogrenciler icin ciddi bir firsat sundu.',
    focusWord: 'firsat',
    answer: 'imkan',
    options: ['imkan', 'engel', 'ceza', 'sikinti'],
    hint: 'Yapabilme olanagi.',
  },
  {
    id: 'cs17',
    sentence: 'Hakem kararini tarafsiz bicimde acikladi.',
    focusWord: 'tarafsiz',
    answer: 'notr',
    options: ['notr', 'yanli', 'kizgin', 'kati'],
    hint: 'Bir tarafi tutmama hali.',
  },
  {
    id: 'cs18',
    sentence: 'Kaptan rotayi degistirerek daha emniyetli bir yol secti.',
    focusWord: 'emniyetli',
    answer: 'guvenli',
    options: ['guvenli', 'tehlikeli', 'uzak', 'dik'],
    hint: 'Risk dusuk olan durum.',
  },
  {
    id: 'cs19',
    sentence: 'Toplanti baslamadan once tum notlar hazirlandi.',
    focusWord: 'hazirlandi',
    answer: 'duzenlendi',
    options: ['duzenlendi', 'silindi', 'ertelendi', 'karistirildi'],
    hint: 'Onceden toparlayip hazir etme.',
  },
  {
    id: 'cs20',
    sentence: 'Uzman bu sorunu cozmeye yonelik pratik bir yontem onerdi.',
    focusWord: 'pratik',
    answer: 'uygulanabilir',
    options: ['uygulanabilir', 'imkansiz', 'karisik', 'soyut'],
    hint: 'Kolayca uygulanabilen yaklasim.',
  },
];

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 10;
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

function selectQuestions(count: number): SentenceQuestion[] {
  return shuffle(QUESTION_BANK).slice(0, count).map((question) => ({
    ...question,
    options: shuffle(question.options),
  }));
}

function highlightFocusWord(sentence: string, focusWord: string): string {
  const normalized = sentence.toLowerCase();
  const needle = focusWord.toLowerCase();
  const startIndex = normalized.indexOf(needle);

  if (startIndex === -1) {
    return sentence;
  }

  return `${sentence.slice(0, startIndex)}[${sentence.slice(startIndex, startIndex + focusWord.length)}]${sentence.slice(
    startIndex + focusWord.length,
  )}`;
}

export function SentenceSynonymGameClient({ gameId, gameTitle, durationSeconds }: SentenceSynonymGameClientProps) {
  const sessionSeconds = useMemo(
    () => Math.max(MIN_DURATION_SECONDS, Math.floor(durationSeconds)),
    [durationSeconds],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [questions, setQuestions] = useState<SentenceQuestion[]>([]);
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
            intelligenceType: 'sozcuk_bilgisi',
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
    setMessage('Cumledeki odak kelimenin en yakin anlamini bul.');
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
        const gained = 100 + level * 8 + Math.min(45, streak * 7);
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
        setLevel(1 + Math.floor(nextIndex / 2));
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
      <div className="stack" style={{ maxWidth: 840 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Cumledeki odak kelimeye en yakin anlama sahip secenegi bul.</p>
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
              lineHeight: 1.6,
            }}
          >
            <div className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              Cumle
            </div>
            <div style={{ fontWeight: 700 }}>{highlightFocusWord(currentQuestion.sentence, currentQuestion.focusWord)}</div>
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
              Ipucu: {currentQuestion.hint}
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
