import { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Box, Button, Typography, Paper } from '@mui/material';

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
  difficulty: number;
  type: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'equations' | 'patterns';
}

interface MathPDFProps {
  grade: number;
  selectedTypes: Set<string>;
}

const MathPDF = ({ grade, selectedTypes }: MathPDFProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [problems, setProblems] = useState<MathProblem[]>([]);

  // Soru üretme fonksiyonu
  const generateProblems = () => {
    const newProblems: MathProblem[] = [];
    const difficulty = Math.min(Math.floor(grade / 2), 5);

    for (let i = 0; i < 10; i++) {
      const type = Array.from(selectedTypes)[Math.floor(Math.random() * selectedTypes.size)] as MathProblem['type'];
      let problem: MathProblem;

      switch (type) {
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
          const answer = num1 + num2;
          const options = [
            answer,
            answer + Math.floor(Math.random() * 5) + 1,
            answer - Math.floor(Math.random() * 5) - 1,
            answer + Math.floor(Math.random() * 10) - 5
          ].sort(() => Math.random() - 0.5);

          problem = {
            question: `${num1} + ${num2} = ?`,
            answer,
            options,
            difficulty,
            type: 'addition'
          };
          break;
        }
        case 'subtraction': {
          let num1, num2;
          if (grade === 1) {
            // 1. sınıf için küçük sayılar ve pozitif sonuç
            num1 = Math.floor(Math.random() * 10) + 10; // 10-20 arası
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // num1'den küçük
          } else {
            const maxNum = 10 ** difficulty;
            num1 = Math.floor(Math.random() * (maxNum - 1)) + 1;
            num2 = Math.floor(Math.random() * num1) + 1; // num1'den küçük
          }
          const answer = num1 - num2;
          const options = [
            answer,
            answer + Math.floor(Math.random() * 5) + 1,
            answer - Math.floor(Math.random() * 5) - 1,
            answer + Math.floor(Math.random() * 10) - 5
          ].sort(() => Math.random() - 0.5);

          problem = {
            question: `${num1} - ${num2} = ?`,
            answer,
            options,
            difficulty,
            type: 'subtraction'
          };
          break;
        }
        case 'multiplication': {
          let num1, num2;
          if (grade === 1) {
            // 1. sınıf için 1-5 arası çarpma
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.floor(Math.random() * 5) + 1;
          } else {
            const maxNum = Math.floor(Math.sqrt(10 ** difficulty)); // Büyük sayıları önlemek için
            num1 = Math.floor(Math.random() * maxNum) + 1;
            num2 = Math.floor(Math.random() * maxNum) + 1;
          }
          const answer = num1 * num2;
          const options = [
            answer,
            answer + num1,
            answer - num2,
            answer + Math.floor(Math.random() * 5) + 1
          ].sort(() => Math.random() - 0.5);

          problem = {
            question: `${num1} × ${num2} = ?`,
            answer,
            options,
            difficulty,
            type: 'multiplication'
          };
          break;
        }
        case 'division': {
          let num1, num2;
          if (grade === 1) {
            // 1. sınıf için kolay bölme (sonuç tam sayı)
            num2 = Math.floor(Math.random() * 5) + 1; // bölen
            const answer = Math.floor(Math.random() * 5) + 1; // sonuç
            num1 = num2 * answer; // bölünen
          } else {
            // Büyük sınıflar için daha büyük sayılar
            num2 = Math.floor(Math.random() * (10 ** (difficulty - 1))) + 1; // bölen
            const answer = Math.floor(Math.random() * (10 ** (difficulty - 1))) + 1; // sonuç
            num1 = num2 * answer; // bölünen
          }
          const answer = num1 / num2;
          const options = [
            answer,
            answer + 1,
            answer - 1,
            answer + 2
          ].sort(() => Math.random() - 0.5);

          problem = {
            question: `${num1} ÷ ${num2} = ?`,
            answer,
            options,
            difficulty,
            type: 'division'
          };
          break;
        }
        case 'patterns': {
          let sequence: number[];
          let answer: number;
          let rule: string;

          if (grade === 1) {
            // 1. sınıf için basit artış örüntüleri
            const start = Math.floor(Math.random() * 5) + 1;
            const increment = Math.floor(Math.random() * 3) + 1;
            sequence = Array.from({length: 4}, (_, i) => start + (i * increment));
            answer = start + (4 * increment);
            rule = `+${increment}`;
          } else {
            // Diğer sınıflar için daha karmaşık örüntüler
            const patterns = [
              // Çarpma örüntüsü
              () => {
                const start = Math.floor(Math.random() * 3) + 1;
                const multiplier = Math.floor(Math.random() * 2) + 2;
                sequence = Array.from({length: 4}, (_, i) => start * (multiplier ** i));
                answer = start * (multiplier ** 4);
                rule = `×${multiplier}`;
                return { sequence, answer, rule };
              },
              // Kare sayılar
              () => {
                const start = Math.floor(Math.random() * 3) + 1;
                sequence = Array.from({length: 4}, (_, i) => (start + i) ** 2);
                answer = (start + 4) ** 2;
                rule = 'kare';
                return { sequence, answer, rule };
              },
              // Fibonacci benzeri
              () => {
                const start = Math.floor(Math.random() * 5) + 1;
                sequence = [start];
                const increment = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < 3; i++) {
                  sequence.push(sequence[i] + increment * (i + 1));
                }
                answer = sequence[sequence.length - 1] + increment * 4;
                rule = 'artan artış';
                return { sequence, answer, rule };
              }
            ];

            const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)]();
            sequence = selectedPattern.sequence;
            answer = selectedPattern.answer;
            rule = selectedPattern.rule;
          }

          const options = [
            answer,
            answer + Math.floor(Math.random() * 5) + 1,
            answer - Math.floor(Math.random() * 5) - 1,
            answer + Math.floor(Math.random() * 10) - 5
          ].sort(() => Math.random() - 0.5);

          problem = {
            question: `${sequence.join(', ')}, ?`,
            answer,
            options,
            difficulty,
            type: 'patterns'
          };
          break;
        }
        default:
          continue;
      }
      newProblems.push(problem);
    }
    setProblems(newProblems);
  };

  // PDF oluşturma
  const generatePDF = async () => {
    if (!pdfRef.current) return;

    try {
      const canvas = await html2canvas(pdfRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Önce soruları ekle
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Sonra filigran ekle
      pdf.setTextColor(240, 240, 240); // Neredeyse beyaz
      pdf.setFontSize(40);
      pdf.text('bilsemc2', pdfWidth/2, pdfHeight/2, { 
        align: 'center',
        angle: 90
      });
      pdf.setTextColor(0, 0, 0); // Siyah renge geri dön

      // Yeni sayfa ekle
      pdf.addPage();

      // İkinci sayfaya da filigran ekle
      pdf.setTextColor(240, 240, 240); // Neredeyse beyaz
      pdf.setFontSize(40);
      pdf.text('bilsemc2', pdfWidth/2, pdfHeight/2, { 
        align: 'center',
        angle: 90
      });
      pdf.setTextColor(0, 0, 0);

      // Cevap anahtarını ekle
      pdf.setFontSize(16);
      pdf.text('Cevaplar', pdfWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);

      problems.forEach((problem, index) => {
        const answer = problem.options.findIndex(opt => opt === problem.answer);
        const letter = String.fromCharCode(65 + answer);
        pdf.text(`${index + 1}. ${letter}`, 20, 40 + (index * 10));
      });

      pdf.save('bilsemc2_Whatsapp_05416150721_Ersan_ogretmen_matematik_sorulari.pdf');
    } catch (error) {
      console.error('PDF oluşturulurken bir hata oluştu:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={generateProblems}
        sx={{ mb: 2, mr: 2 }}
      >
        10 Soru Oluştur
      </Button>

      {problems.length > 0 && (
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={generatePDF}
          sx={{ mb: 2 }}
        >
          PDF İndir
        </Button>
      )}

      <div ref={pdfRef}>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h4" gutterBottom align="center">
            {grade}. Sınıf Matematik Soruları
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="textSecondary">
            (10 Soru)
          </Typography>

          {problems.map((problem, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="h6">
                {index + 1}. {problem.question}
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, pl: 3, mt: 1 }}>
                {problem.options.map((option, optIndex) => (
                  <Typography key={optIndex}>
                    {String.fromCharCode(65 + optIndex)}) {option}
                  </Typography>
                ))}
              </Box>
            </Box>
          ))}
        </Paper>
      </div>
    </Box>
  );
};

export default MathPDF;
