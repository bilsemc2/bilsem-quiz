import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Fade,
  Grow,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  EmojiEvents,
  Settings,
  Close,
  MenuBook,
  Stairs,
  PictureAsPdf,
  Info,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import MathPDF from '../components/MathPDF';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Interface (aynı kalır)
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

// Styled component for answer buttons (aynı kalır)
const AnswerButton = styled(Button)(({ theme }) => ({
  justifyContent: 'flex-start',
  padding: theme.spacing(1.5, 2),
  textTransform: 'none',
  fontSize: '1.1rem',
  marginBottom: theme.spacing(1),
  transition: 'background-color 0.3s ease, border-color 0.3s ease',
}));

const MathWorld: React.FC = () => {
  const { user, loading: userLoading } = useAuth();
  const navigate = useNavigate();

  // State'ler (aynı kalır)
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auth yönlendirmesi (aynı kalır)
  useEffect(() => {
    if (!user && !userLoading) {
      navigate('/login');
    }
  }, [user, userLoading, navigate]);

  // --- generateProblem fonksiyonu (içerik aynı, burada tekrar eklenmedi) ---
  const generateProblem = useCallback(() => {
    setLoading(true);
    setShowExplanation(false);
    setIsCorrect(null);
    setUserAnswer(null);

    let problem: MathProblem;
    const difficulty = Math.min(Math.floor(grade / 2), 5);

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

    const generateOptions = (
      correctAnswer: number,
      min: number,
      max: number
    ): number[] => {
      const options = new Set<number>();
      options.add(correctAnswer);
      while (options.size < 4) {
        let wrongAnswer: number;
         if (type === 'patterns') {
          const offset = Math.floor(Math.random() * 5) + 1;
          wrongAnswer =
            Math.random() < 0.5
              ? correctAnswer + offset
              : Math.max(correctAnswer - offset, 1);
         } else {
            wrongAnswer = Math.floor(Math.random() * (max - min + 1)) + min;
         }
         if (wrongAnswer !== correctAnswer && wrongAnswer >= Math.max(1, min) && wrongAnswer <= max) {
            options.add(wrongAnswer);
         }
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
          rule = 'Her sayı önceki iki sayının toplamıdır (Fibonacci benzeri).';
        }
        problem = {
          question: `Örüntüyü tamamlayın: ${pattern.join(', ')}, ?`,
          answer: nextNumber,
          options: generateOptions(nextNumber, 1, nextNumber + 10),
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
          const maxNum = 5 * (10 ** Math.min(difficulty, 2));
          num1 = Math.floor(Math.random() * maxNum) + 1;
          num2 = Math.floor(Math.random() * maxNum) + 1;
        }
        const sum = num1 + num2;
        problem = {
          question: `${num1} + ${num2} = ?`,
          answer: sum,
          options: generateOptions(sum, Math.max(1, sum - 15), sum + 15),
          difficulty,
          type,
          explanation: `${num1} ve ${num2} toplanır, sonuç ${sum} olur.`
        };
        break;
      }
       case 'subtraction': {
         let num1, num2;
         if (grade <= 2){
            num1 = Math.floor(Math.random() * 15) + 5;
            num2 = Math.floor(Math.random() * num1);
         } else {
            const maxNum = 5 * (10 ** Math.min(difficulty, 2));
            num1 = Math.floor(Math.random() * maxNum) + Math.floor(maxNum/10);
            num2 = Math.floor(Math.random() * num1);
         }
        const diff = num1 - num2;
        problem = {
          question: `${num1} - ${num2} = ?`,
          answer: diff,
          options: generateOptions(diff, Math.max(1, diff - 15), diff + 15),
          difficulty,
          type,
          explanation: `${num1}'den ${num2} çıkarılır, sonuç ${diff} olur.`
        };
        break;
      }
      case 'multiplication': {
        const adjustedDifficulty = Math.max(1, difficulty);
        const factorLimit = grade <= 4 ? 10 : 12;
        const num1 = Math.floor(Math.random() * (5 * (10 ** Math.min(adjustedDifficulty-1, 1)) ) ) + 1;
        const num2 = Math.floor(Math.random() * factorLimit) + 1;
        const product = num1 * num2;
        problem = {
          question: `${num1} × ${num2} = ?`,
          answer: product,
          options: generateOptions(product, Math.max(1, product - 30), product + 30),
          difficulty,
          type,
          explanation: `${num1} ile ${num2} çarpılır, sonuç ${product} olur.`
        };
        break;
      }
      case 'division': {
        const adjustedDifficulty = Math.max(1, difficulty);
        const divisorLimit = grade <= 5 ? 9 : 12;
        const num2 = Math.floor(Math.random() * divisorLimit) + 1;
        const result = Math.floor(Math.random() * (10 ** adjustedDifficulty)) + 1;
        const num1 = num2 * result;
        problem = {
          question: `${num1} ÷ ${num2} = ?`,
          answer: result,
          options: generateOptions(result, Math.max(1, result - 10), result + 10),
          difficulty,
          type,
          explanation: `${num1}, ${num2}'ye bölünür, sonuç ${result} olur.`
        };
        break;
      }
      case 'equations': {
        const x = Math.floor(Math.random() * 10) + 1;
        const a = Math.floor(Math.random() * (grade - 5)) + 1;
        const b = Math.floor(Math.random() * 20) - 10;
        const c = a * x + b;
        const bSign = b < 0 ? '-' : '+';
        const absB = Math.abs(b);
        problem = {
          question: `${a}x ${bSign} ${absB} = ${c},   x = ?`,
          answer: x,
          options: generateOptions(x, Math.max(1, x - 5), x + 5),
          difficulty,
          type,
          explanation: `Denklem ${a}x = ${c - b} olur. x = ${c-b} / ${a} = ${x}.`
        };
        break;
      }
      default:
        problem = {
          question: '2 + 3 = ?',
          answer: 5,
          options: generateOptions(5, 1, 10),
          difficulty: 1,
          type: 'addition',
          explanation: 'Basit toplama.'
        };
    }

    setCurrentProblem(problem);
    setLoading(false);
  }, [grade, selectedTypes]);

  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  // handleAnswer (aynı kalır)
  const handleAnswer = () => {
    if (!currentProblem || userAnswer === null) return;
    const correct = userAnswer === currentProblem.answer;
    setIsCorrect(correct);
    if (correct) {
      toast.success('Doğru!', { duration: 1500, icon: '🎉' });
      setScore(prev => prev + (currentProblem.difficulty * 10));
      setStreak(prev => prev + 1);
    } else {
      toast.error(`Yanlış! Doğru cevap: ${currentProblem.answer}`, { duration: 2500, icon: '😔' });
      setStreak(0);
    }
  };

  // Kullanıcı yükleniyorsa (aynı kalır)
  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // --- TASARIM UYGULANMIŞ RENDER ---
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* Üst Bilgi Çubuğu (AppBar) */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Matematik Dünyası
          </Typography>
          <Stack direction="row" spacing={3} alignItems="center">
             {/* Skor ve Seri göstergeleri */}
             <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" display="block" color="text.secondary">Skor</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>{score}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" display="block" color="text.secondary">Seri</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <EmojiEvents color={streak > 0 ? "warning" : "disabled"} sx={{ fontSize: '1.2rem' }} />
                <Typography sx={{ fontWeight: 'bold' }}>{streak}</Typography>
              </Stack>
            </Box>
            {/* Ayarlar Butonu */}
            <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
              <Settings />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Ana İçerik Alanı */}
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, width: '100%', textAlign: 'center', borderRadius: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : currentProblem ? (
            <Fade in={!loading}>
              <div>
                {/* Soru Alanı - DÜZENLENDİ */}
                <Typography
                  component="h2" // Semantik olarak daha uygun
                  gutterBottom
                  sx={{
                    fontWeight: 500,
                    minHeight: '3em', // Yüksekliği koru
                    mb: 4,
                    textAlign: 'center', // Metni ortala
                    // Responsive font boyutu - Ekran boyutuna göre ayarla
                    fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' },
                    wordBreak: 'break-word', // Uzun metinlerin taşmasını engelle
                    pt: '0.5em', // Dikey hizalama için padding (flex kaldırıldığı için)
                    pb: '0.5em',
                    lineHeight: 1.3, // Satır yüksekliğini ayarla
                  }}
                >
                  {currentProblem.question}
                </Typography>
                {/* --- BİTTİ: Soru Alanı Düzenlemesi --- */}


                {/* Cevap Seçenekleri (Stilleri aynı) */}
                <Grid container spacing={2} justifyContent="center">
                  {currentProblem.options.map((option, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Grow in={!loading} timeout={500 + index * 100}>
                        <AnswerButton
                          fullWidth
                          variant={userAnswer === option ? 'contained' : 'outlined'}
                          onClick={() => {if (isCorrect === null) setUserAnswer(option);}}
                          disabled={isCorrect !== null}
                          color={
                             isCorrect === true && option === currentProblem.answer ? 'success' :
                             isCorrect === false && userAnswer === option ? 'error' :
                             isCorrect !== null && option === currentProblem.answer ? 'success' :
                             'primary'
                          }
                           startIcon={
                            isCorrect === true && option === currentProblem.answer ? <CheckCircle /> :
                            isCorrect === false && userAnswer === option ? <Cancel /> :
                             isCorrect !== null && option === currentProblem.answer ? <CheckCircle /> :
                             null
                          }
                        >
                          <Typography component="span" sx={{ fontWeight: 'bold', mr: 1 }}>{String.fromCharCode(65 + index)}.</Typography>
                          {option}
                        </AnswerButton>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>

                {/* Kontrol Et / Yeni Soru Butonları (Aynı) */}
                <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
                   {isCorrect === null ? (
                      <Button
                          variant="contained"
                          onClick={handleAnswer}
                          disabled={userAnswer === null}
                          size="large"
                          sx={{ minWidth: 150 }}
                      >
                          Kontrol Et
                      </Button>
                   ) : (
                       <Button
                          variant="contained"
                          onClick={generateProblem}
                          startIcon={<Refresh />}
                          size="large"
                          sx={{ minWidth: 150 }}
                       >
                           Yeni Soru
                       </Button>
                   )}
                </Box>

                 {/* Açıklama (Aynı) */}
                {isCorrect !== null && currentProblem.explanation && (
                   <Box sx={{ mt: 2 }}>
                     <Button
                       size="small"
                       onClick={() => setShowExplanation(prev => !prev)}
                       startIcon={<Info />}
                     >
                       {showExplanation ? 'Açıklamayı Gizle' : 'Açıklamayı Gör'}
                     </Button>
                     <Fade in={showExplanation}>
                       <Alert severity="info" sx={{ mt: 1, textAlign: 'left' }}>
                         {currentProblem.explanation}
                       </Alert>
                     </Fade>
                   </Box>
                )}

              </div>
            </Fade>
          ) : (
            <Typography>Problem yüklenemedi veya bulunamadı.</Typography>
          )}
        </Paper>
      </Container>

      {/* Ayarlar Çekmecesi (Drawer) (Aynı) */}
      <Drawer anchor="right" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
         <Box sx={{ width: 280, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Ayarlar</Typography>
            <IconButton onClick={() => setSettingsOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }}/>

          <List>
            {/* Sınıf Seçimi */}
            <ListItem>
               <ListItemIcon><Stairs /></ListItemIcon>
               <FormControl fullWidth variant="standard">
                <InputLabel>Sınıf Seviyesi</InputLabel>
                <Select
                  value={grade}
                  onChange={(e) => {
                     const newGrade = Number(e.target.value);
                     setGrade(newGrade);
                      const newAvailableTypes =
                        newGrade <= 2 ? ['addition', 'patterns']
                        : newGrade <= 3 ? ['addition', 'subtraction', 'patterns']
                        : newGrade <= 4 ? ['addition', 'subtraction', 'multiplication', 'patterns']
                        : newGrade <= 6 ? ['addition', 'subtraction', 'multiplication', 'division', 'patterns']
                        : ['addition', 'subtraction', 'multiplication', 'division', 'equations', 'patterns'];
                      setSelectedTypes(prev => {
                        const newSelected = new Set( [...prev].filter(t => newAvailableTypes.includes(t)) );
                        if (newSelected.size === 0) newSelected.add(newAvailableTypes[0] || 'addition');
                        return newSelected;
                      });
                   }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => ( <MenuItem key={g} value={g}>{g}. Sınıf</MenuItem> ))}
                </Select>
              </FormControl>
            </ListItem>

             {/* Tür Seçimi */}
             <ListItem>
               <ListItemIcon><MenuBook /></ListItemIcon>
               <FormControl fullWidth variant="standard">
                <InputLabel>Soru Tipleri</InputLabel>
                <Select
                  multiple
                  value={[...selectedTypes]}
                  onChange={(e) => { const values = e.target.value as string[]; if (values.length > 0) setSelectedTypes(new Set(values)); }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => ( <Chip key={value} label={{addition: 'Toplama', subtraction: 'Çıkarma', multiplication: 'Çarpma', division: 'Bölme', equations: 'Denklemler', patterns: 'Örüntüler'}[value] || value} size="small" /> ))}
                    </Box>
                  )}
                >
                   {[ { value: 'addition', label: 'Toplama', minGrade: 1 }, { value: 'subtraction', label: 'Çıkarma', minGrade: 3 }, { value: 'multiplication', label: 'Çarpma', minGrade: 4 }, { value: 'division', label: 'Bölme', minGrade: 5 }, { value: 'equations', label: 'Denklemler', minGrade: 7 }, { value: 'patterns', label: 'Örüntüler', minGrade: 1 } ].map((option) => ( <MenuItem key={option.value} value={option.value} disabled={grade < (option.minGrade || 1)}> {option.label} </MenuItem> ))}
                </Select>
              </FormControl>
             </ListItem>

             <Divider sx={{ my: 2 }}/>

             {/* PDF Oluşturma */}
             <ListItem> <ListItemIcon><PictureAsPdf /></ListItemIcon> <ListItemText primary="PDF Oluştur" /> </ListItem>
              <Box sx={{pl: 2, pr: 2}}> <MathPDF grade={grade} selectedTypes={selectedTypes} /> </Box>

             <Divider sx={{ my: 2 }}/>

              {/* İpuçları */}
             <ListItem> <ListItemIcon><Info /></ListItemIcon> <ListItemText primary="İpuçları" /> </ListItem>
             <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                • Soruları dikkatlice okuyun.<br />
                • İşlem önceliğine dikkat edin.<br />
                • Cevabınızdan emin olun.<br />
                • Seri yaparak skorunuzu artırın!
             </Typography>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MathWorld;