import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, Loader2 } from 'lucide-react';

interface Deyim {
  deyim: string;
  aciklama: string;
  ornek: string | null;
}

interface Option {
  label: string;
  text: string;
  isCorrect: boolean;
}

interface DeyimlerPDFProps {
  deyimler: Deyim[];
}

const DeyimlerPDF = ({ deyimler }: DeyimlerPDFProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Option[][]>([]);

  // Deyimlerden 10 soru seç ve hazırla
  const selectedDeyimler = useMemo(() => deyimler.slice(0, 10), [deyimler]);

  // Şıkları oluştur ve karıştır
  const generateOptions = useCallback((correctAnswer: string, allDeyimler: Deyim[]): Option[] => {
    const wrongAnswers = allDeyimler
      .filter(d => d.aciklama !== correctAnswer)
      .map(d => d.aciklama)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options: Option[] = [
      { label: '', text: correctAnswer, isCorrect: true },
      { label: '', text: wrongAnswers[0] || '', isCorrect: false },
      { label: '', text: wrongAnswers[1] || '', isCorrect: false },
      { label: '', text: wrongAnswers[2] || '', isCorrect: false },
    ].sort(() => Math.random() - 0.5);

    // Karıştırdıktan sonra label'ları ata
    return options.map((opt, i) => ({ ...opt, label: ['A', 'B', 'C', 'D'][i] }));
  }, []);

  // Başlangıçta soruları hazırla
  useEffect(() => {
    const questions = selectedDeyimler.map(deyim =>
      generateOptions(deyim.aciklama, deyimler)
    );
    setShuffledQuestions(questions);
  }, [selectedDeyimler, deyimler, generateOptions]);

  // Cevap anahtarını hesapla
  const answerKey = useMemo(() =>
    shuffledQuestions.map(options =>
      options.find(opt => opt.isCorrect)?.label || 'A'
    ), [shuffledQuestions]);

  const generatePDF = async () => {
    if (!pdfRef.current) return;
    setIsGenerating(true);

    try {
      // Cevap anahtarını gizle
      const answerKeyEl = document.getElementById('answer-key');
      if (answerKeyEl) answerKeyEl.style.display = 'none';

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      if (answerKeyEl) answerKeyEl.style.display = 'block';

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        (pdfWidth - imgWidth * ratio) / 2,
        0,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save('deyimler_testi.pdf');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="mb-4 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 
                   transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2 font-medium"
      >
        {isGenerating ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Oluşturuluyor...</>
        ) : (
          <><FileDown className="w-5 h-5" /> PDF Oluştur</>
        )}
      </button>

      <div ref={pdfRef} className="bg-white p-8 shadow-xl rounded-2xl border border-slate-200">
        {/* Başlık */}
        <div className="text-center mb-8 pb-6 border-b-2 border-indigo-100">
          <h1 className="text-3xl font-bold text-indigo-700 mb-6">Deyimler Testi</h1>
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {['Ad Soyad', 'Sınıf', 'Tarih'].map(label => (
              <div key={label} className="text-left">
                <span className="text-sm font-semibold text-slate-600">{label}:</span>
                <div className="mt-1 h-8 border-b-2 border-slate-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Sorular */}
        <div className="space-y-6">
          {selectedDeyimler.map((deyim, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-xl">
              <p className="font-semibold text-slate-800 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 bg-indigo-600 text-white rounded-full text-sm mr-2">
                  {index + 1}
                </span>
                "{deyim.deyim}" deyiminin anlamı nedir?
              </p>
              <div className="grid grid-cols-2 gap-2 pl-9">
                {shuffledQuestions[index]?.map(option => (
                  <div key={option.label} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-indigo-600 min-w-[20px]">{option.label})</span>
                    <span className="text-slate-700 text-sm">{option.text}</span>
                  </div>
                ))}
              </div>
              {deyim.ornek && (
                <p className="mt-3 pl-9 text-sm text-slate-500 italic">
                  💡 Örnek: {deyim.ornek}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Cevap Anahtarı */}
        <div id="answer-key" className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <h2 className="text-lg font-bold text-emerald-700 mb-3">📋 Cevap Anahtarı</h2>
          <div className="flex flex-wrap gap-4">
            {answerKey.map((answer, i) => (
              <div key={i} className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg border border-emerald-300">
                <span className="font-bold text-slate-600">{i + 1}.</span>
                <span className="font-bold text-emerald-600">{answer}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            ⚠️ Bu bölüm PDF'de görünmeyecektir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeyimlerPDF;
