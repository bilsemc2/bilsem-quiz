import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel, Refresh, EmojiEvents } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import MathPDF from '../components/MathPDF';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
  difficulty: number;
  type:
    | 'addition'
    | 'subtraction'
    | 'multiplication'
    | 'division'
    | 'equations'
    | 'patterns';
  explanation?: string;
  pattern?: number[];
}

const MathWorld: React.FC = () => {
  const { user, loading: userLoading } = useAuth();
  const navigate = useNavigate();
  const { hasEnoughXP } = useXPCheck();
  const [currentXP, setCurrentXP] = useState<number>(0);

  // Kullanıcının XP'sini almak için
  useEffect(() => {
    const fetchXP = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience')
          .eq('id', user.id)
          .single();
        setCurrentXP(profile?.experience || 0);
      }
    };
    fetchXP();
  }, [user]);

  // Kullanıcı giriş yapmamışsa otomatik olarak login sayfasına yönlendir.
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Diğer state’ler
  const [grade, setGrade] = useState<number>(1);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(['addition', 'patterns'])
  );

  // Problem üretimi (örnek: toplama, çıkarma, çarpma, bölme, denklemler, örüntüler)
  const generateProblem = useCallback(() => {
    setLoading(true);
    setShowExplanation(false);
    setIsCorrect(null);
    setUserAnswer(null);

    let problem: MathProblem;
    const difficulty = Math.min(Math.floor(grade / 2), 5);

    // Sınıf düzeyine göre kullanılabilir soru türleri
    const availableTypes: (MathProblem['type'])[] =
      grade <= 2
        ? ['addition', 'patterns']
        : grade <= 3
        ? ['addition', 'subtraction', 'patterns']
        : grade <= 4
        ? ['addition', 'subtraction', 'multiplication', 'patterns']
        : grade <= 6
        ? ['addition', 'subtraction', 'multiplication', 'division', 'patterns']
        : ['addition', 'subtraction', 'multiplication', 'division', 'equations', 'patterns'];

    // Seçili ve kullanılabilir türler arasından rastgele seçim
    const availableSelectedTypes = availableTypes.filter(t =>
      selectedTypes.has(t)
    );
    let type: MathProblem['type'];
    if (availableSelectedTypes.length === 0) {
      type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      setSelectedTypes(new Set([type]));
    } else {
      type =
        availableSelectedTypes[
          Math.floor(Math.random() * availableSelectedTypes.length)
        ];
    }

    // Yanlış seçenekler oluşturma fonksiyonu
    const generateOptions = (
      correctAnswer: number,
      min: number,
      max: number
    ): number[] => {
      const options = new Set<number>();
      options.add(correctAnswer);
      while (options.size < 5) {
        let wrongAnswer: number;
        if (type === 'patterns') {
          const offset = Math.floor(Math.random() * 5) + 1;
          wrongAnswer =
            Math.random() < 0.5
              ? correctAnswer + offset
              : Math.max(correctAnswer - offset, 1);
        } else {
          wrongAnswer = Math.floor(Math.random() * (max - min + 1)) + min;
          if (Math.abs(wrongAnswer - correctAnswer) === 0) continue;
        }
        options.add(wrongAnswer);
      }
      return Array.from(options).sort(() => Math.random() - 0.5);
    };

    switch (type) {
      case 'patterns': {
        let pattern: number[] = [];
        let rule = '';
        let nextNumber = 0;
        if (grade <= 2) {
          const increment = Math.floor(Math.random() * 2) + 1;
          const start = Math.floor(Math.random() * 5) + 1;
          pattern = Array.from({ length: 3 }, (_, i) => start + i * increment);
          nextNumber = start + 3 * increment;
          rule = `Her sayı ${increment} artıyor.`;
        } else if (grade <= 4) {
          const multiplier = Math.floor(Math.random() * 2) + 2;
          const start = Math.floor(Math.random() * 3) + 1;
          pattern = Array.from({ length: 3 }, (_, i) => start * Math.pow(multiplier, i));
          nextNumber = start * Math.pow(multiplier, 3);
          rule = `Her sayı ${multiplier} ile çarpılıyor.`;
        } else if (grade <= 6) {
          const operations = ['+', '*'];
          const operation = operations[Math.floor(Math.random() * operations.length)];
          const factor = Math.floor(Math.random() * 3) + 2;
          const start = Math.floor(Math.random() * 5) + 1;
          if (operation === '+') {
            pattern = Array.from({ length: 3 }, (_, i) => start + i * factor);
            nextNumber = start + 3 * factor;
            rule = `Her sayıya ${factor} ekleniyor.`;
          } else {
            pattern = Array.from({ length: 3 }, (_, i) => start * Math.pow(factor, i));
            nextNumber = start * Math.pow(factor, 3);
            rule = `Her sayı ${factor} ile çarpılıyor.`;
          }
        } else {
          const start1 = Math.floor(Math.random() * 5) + 1;
          const start2 = Math.floor(Math.random() * 5) + start1;
          pattern = [start1, start2, start1 + start2];
          nextNumber = pattern[1] + pattern[2];
          rule = 'Her sayı önceki iki sayının toplamıdır.';
        }
        problem = {
          question: `Örüntüyü tamamlayın: ${pattern.join(', ')}, ?`,
          answer: nextNumber,
          options: generateOptions(nextNumber, 1, nextNumber * 2),
          difficulty,
          type,
          pattern,
          explanation: `Kural: ${rule}`
        };
        break;
      }
      case 'addition': {
        let num1, num2;
        if (grade === 1) {
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          while (num1 + num2 > 20) {
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
          }
        } else {
          const maxNum = 10 ** difficulty;
          num1 = Math.floor(Math.random() * (maxNum - 1)) + 1;
          num2 = Math.floor(Math.random() * (maxNum - 1)) + 1;
        }
        const sum = num1 + num2;
        problem = {
          question: `${num1} + ${num2} = ?`,
          answer: sum,
          options: generateOptions(sum, Math.max(0, sum - 10), sum + 10),
          difficulty,
          type,
          explanation: `${num1} ve ${num2} toplanıyor.`
        };
        break;
      }
      case 'subtraction': {
        const num1 = Math.floor(Math.random() * (10 ** difficulty));
        const num2 = Math.floor(Math.random() * num1);
        const diff = num1 - num2;
        problem = {
          question: `${num1} - ${num2} = ?`,
          answer: diff,
          options: generateOptions(diff, Math.max(0, diff - 10), diff + 10),
          difficulty,
          type,
          explanation: `${num1}'den ${num2} çıkarılıyor.`
        };
        break;
      }
      case 'multiplication': {
        const num1 = Math.floor(Math.random() * (10 ** (difficulty - 1))) + 1;
        const num2 = Math.floor(Math.random() * (10 ** (difficulty - 1))) + 1;
        const product = num1 * num2;
        problem = {
          question: `${num1} × ${num2} = ?`,
          answer: product,
          options: generateOptions(product, Math.max(0, product - 20), product + 20),
          difficulty,
          type,
          explanation: `${num1} ile ${num2} çarpılıyor.`
        };
        break;
      }
      case 'division': {
        const num2 = Math.floor(Math.random() * (10 ** (difficulty - 1))) + 1;
        const result = Math.floor(Math.random() * (10 ** (difficulty - 1))) + 1;
        const num1 = num2 * result;
        problem = {
          question: `${num1} ÷ ${num2} = ?`,
          answer: result,
          options: generateOptions(result, Math.max(0, result - 5), result + 5),
          difficulty,
          type,
          explanation: `${num1}'i ${num2}'ye bölüyoruz.`
        };
        break;
      }
      case 'equations': {
        const x = Math.floor(Math.random() * 10) + 1;
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * 20);
        problem = {
          question: `${a}x + ${b} = ${a * x + b}, x = ?`,
          answer: x,
          options: generateOptions(x, Math.max(0, x - 5), x + 5),
          difficulty,
          type,
          explanation: `Denklemi çözmek için x’i yalnız bırakıyoruz.`
        };
        break;
      }
      default:
        problem = {
          question: '1 + 1 = ?',
          answer: 2,
          options: generateOptions(2, 0, 5),
          difficulty: 1,
          type: 'addition',
          explanation: 'Basit toplama: 1 + 1 = 2'
        };
    }

    setCurrentProblem(problem);
    setLoading(false);
  }, [grade, selectedTypes]);

  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  const handleAnswer = () => {
    if (!currentProblem || userAnswer === null) return;

    const correct = userAnswer === currentProblem.answer;
    setIsCorrect(correct);

    if (correct) {
      const xpGain = Math.max(1, 3 * currentProblem.difficulty);
      const updateXP = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience')
          .eq('id', user?.id)
          .single();

        const currentXP = profile?.experience || 0;
        const { error } = await supabase
          .from('profiles')
          .update({ experience: currentXP + xpGain })
          .eq('id', user?.id);

        if (error) {
          toast.error('XP güncellenirken hata oluştu');
        } else {
          toast.success(`Tebrikler! ${xpGain} XP kazandınız!`);
        }
      };

      updateXP();
      setScore(prev => prev + (currentProblem.difficulty * 10));
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  // Kullanıcı giriş yapmamışsa veya yükleme durumundaysa
  if (!user || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center">
        <div className="text-2xl font-semibold">
          {!user ? 'Yönlendiriliyor...' : 'Yükleniyor...'}
        </div>
      </div>
    );
  }

  // Yeterli XP yoksa
  if (!hasEnoughXP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <XPWarning
          requiredXP={50}
          currentXP={currentXP}
          title="Matematik Dünyası'na erişim için yeterli XP'niz yok"
        />
      </div>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* PDF Oluşturma Bölümü */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          PDF Oluştur
        </Typography>
        <MathPDF grade={grade} selectedTypes={selectedTypes} />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" gutterBottom align="center" color="primary">
        Matematik Dünyası
      </Typography>

      <Grid container spacing={3}>
        {/* Sol Panel: Skor ve Ayarlar */}
        <Grid item xs={12} md={3}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skorunuz
              </Typography>
              <Typography variant="h4" color="primary">
                {score}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <EmojiEvents color="warning" />
                <Typography variant="body1" sx={{ ml: 1 }}>
                  Seri: {streak}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Sınıf Seviyesi</InputLabel>
            <Select
              value={grade}
              label="Sınıf Seviyesi"
              onChange={(e) => {
                const newGrade = Number(e.target.value);
                setGrade(newGrade);
                const newAvailableTypes =
                  newGrade <= 2
                    ? ['addition', 'patterns']
                    : newGrade <= 3
                    ? ['addition', 'subtraction', 'patterns']
                    : newGrade <= 4
                    ? ['addition', 'subtraction', 'multiplication', 'patterns']
                    : newGrade <= 6
                    ? ['addition', 'subtraction', 'multiplication', 'division', 'patterns']
                    : ['addition', 'subtraction', 'multiplication', 'division', 'equations', 'patterns'];
                setSelectedTypes(prev => {
                  const newSelected = new Set(
                    [...prev].filter(t => newAvailableTypes.includes(t))
                  );
                  if (newSelected.size === 0) newSelected.add('addition');
                  return newSelected;
                });
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                <MenuItem key={g} value={g}>
                  {g}. Sınıf
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Soru Tipleri</InputLabel>
            <Select
              multiple
              value={[...selectedTypes]}
              label="Soru Tipleri"
              onChange={(e) => {
                const values = e.target.value as string[];
                if (values.length === 0) return;
                setSelectedTypes(new Set(values));
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip
                      key={value}
                      label={{
                        addition: 'Toplama',
                        subtraction: 'Çıkarma',
                        multiplication: 'Çarpma',
                        division: 'Bölme',
                        equations: 'Denklemler',
                        patterns: 'Örüntüler'
                      }[value]}
                    />
                  ))}
                </Box>
              )}
            >
              {[
                { value: 'addition', label: 'Toplama' },
                { value: 'subtraction', label: 'Çıkarma' },
                { value: 'multiplication', label: 'Çarpma' },
                { value: 'division', label: 'Bölme' },
                { value: 'equations', label: 'Denklemler' },
                { value: 'patterns', label: 'Örüntüler' }
              ].map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={
                    !(
                      grade <= 2
                        ? ['addition', 'patterns'].includes(option.value)
                        : grade <= 3
                        ? ['addition', 'subtraction', 'patterns'].includes(option.value)
                        : grade <= 4
                        ? ['addition', 'subtraction', 'multiplication', 'patterns'].includes(option.value)
                        : grade <= 6
                        ? ['addition', 'subtraction', 'multiplication', 'division', 'patterns'].includes(option.value)
                        : true
                    )
                  }
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Orta Panel: Soru ve Cevap */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            {loading ? (
              <CircularProgress />
            ) : currentProblem ? (
              <>
                <Typography variant="h4" gutterBottom>
                  {currentProblem.question}
                </Typography>

                <Box sx={{ my: 2, display: 'grid', gap: 1 }}>
                  {currentProblem.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={
                        userAnswer === option ? 'contained' : 'outlined'
                      }
                      onClick={() => setUserAnswer(option)}
                      disabled={isCorrect !== null}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </Button>
                  ))}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleAnswer}
                    disabled={userAnswer === null || isCorrect !== null}
                  >
                    Kontrol Et
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={generateProblem}
                    startIcon={<Refresh />}
                  >
                    Yeni Soru
                  </Button>
                </Box>

                {isCorrect !== null && (
                  <Box sx={{ mt: 2 }}>
                    {isCorrect ? (
                      <Alert
                        icon={<CheckCircle />}
                        severity="success"
                        action={
                          <Button color="inherit" size="small" onClick={() => setShowExplanation(true)}>
                            Açıklamayı Gör
                          </Button>
                        }
                      >
                        Harika! Doğru cevap!
                      </Alert>
                    ) : (
                      <Alert
                        icon={<Cancel />}
                        severity="error"
                        action={
                          <Button color="inherit" size="small" onClick={() => setShowExplanation(true)}>
                            Açıklamayı Gör
                          </Button>
                        }
                      >
                        Üzgünüm, yanlış cevap. Doğru cevap: {currentProblem.answer}
                      </Alert>
                    )}
                  </Box>
                )}

                {showExplanation && currentProblem.explanation && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {currentProblem.explanation}
                  </Alert>
                )}
              </>
            ) : null}
          </Paper>
        </Grid>

        {/* Sağ Panel: İpuçları ve Yardım */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                İpuçları
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Soruları dikkatlice okuyun
                <br />
                • İşlem önceliğine dikkat edin
                <br />
                • Hesap makinesi kullanmamaya çalışın
                <br />
                • Seri yaparak daha çok puan kazanın!
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MathWorld;