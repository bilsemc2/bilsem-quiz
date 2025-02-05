import { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface DeyimlerPDFProps {
  deyimler: Array<{
    deyim: string;
    aciklama: string;
    ornek: string | null;
  }>;
}

const DeyimlerPDF = ({ deyimler }: DeyimlerPDFProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [answerKey, setAnswerKey] = useState<string[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<Array<Array<{label: string; text: string}>>>([]);

  // Rastgele yanlış cevaplar oluştur
  const generateWrongAnswers = (correctAnswer: string, allDeyimler: typeof deyimler) => {
    const wrongAnswers = allDeyimler
      .filter(d => d.aciklama !== correctAnswer) // Doğru cevabı hariç tut
      .map(d => d.aciklama) // Sadece açıklamaları al
      .sort(() => Math.random() - 0.5) // Karıştır
      .slice(0, 3); // İlk 3 tanesini al

    return wrongAnswers;
  };

  // Şıkları karıştır
  const shuffleOptions = (correctAnswer: string, wrongAnswers: string[]) => {
    const options = [
      { label: 'A', text: correctAnswer },
      { label: 'B', text: wrongAnswers[0] },
      { label: 'C', text: wrongAnswers[1] },
      { label: 'D', text: wrongAnswers[2] }
    ];
    // Şıkları rastgele sırala
    return options.sort(() => Math.random() - 0.5);
  };

  // Başlangıçta şıkları ve cevap anahtarını oluştur
  useEffect(() => {
    const newShuffledOptions = deyimler.slice(0, 10).map(deyim => {
      return shuffleOptions(deyim.aciklama, generateWrongAnswers(deyim.aciklama, deyimler));
    });
    setShuffledOptions(newShuffledOptions);

    const newAnswerKey = newShuffledOptions.map(options => {
      const correctOption = options.find(opt => opt.text === options[0].text);
      return correctOption?.label || 'A';
    });
    setAnswerKey(newAnswerKey);
  }, [deyimler]);

  const generatePDF = async () => {
    if (!pdfRef.current) return;

    // PDF oluşturmadan önce cevap anahtarını gizle
    const answerKey = document.getElementById('answer-key');
    if (answerKey) answerKey.style.display = 'none';

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    // PDF oluşturduktan sonra cevap anahtarını tekrar göster
    if (answerKey) answerKey.style.display = 'block';

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(
      imgData,
      'JPEG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    pdf.save('deyimler_testi.pdf');
  };

  return (
    <div className="p-4">
      <button
        onClick={generatePDF}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        PDF Oluştur
      </button>

      <div ref={pdfRef} className="bg-white p-8 shadow-lg rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4">Deyimler Testi</h1>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <span className="font-semibold">Ad Soyad:</span>
              <div className="border-b border-gray-400 flex-grow"></div>
            </div>
            <div className="flex space-x-2">
              <span className="font-semibold">Sınıf:</span>
              <div className="border-b border-gray-400 flex-grow"></div>
            </div>
            <div className="flex space-x-2">
              <span className="font-semibold">Tarih:</span>
              <div className="border-b border-gray-400 flex-grow"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {deyimler.slice(0, 10).map((deyim, index) => (
            <div key={index} className="border-b pb-4">
              <p className="font-semibold mb-2">
                {index + 1}. "{deyim.deyim}" deyiminin anlamı aşağıdakilerden hangisidir?
              </p>
              <div className="pl-6 space-y-2">
                {shuffledOptions[index]?.map((option) => (
                  <div key={option.label} className="flex items-start space-x-2">
                    <span className="font-semibold">{option.label})</span>
                    <p>{option.text}</p>
                  </div>
                ))}
              </div>
              {deyim.ornek && (
                <div className="mt-2 text-gray-600 italic">
                  Örnek: {deyim.ornek}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cevap Anahtarı - PDF'de gözükmeyecek */}
        <div id="answer-key" className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Cevap Anahtarı</h2>
          <div className="grid grid-cols-5 gap-4">
            {deyimler.slice(0, 10).map((_, index) => (
              <div key={index} className="text-center">
                <span className="font-semibold">{index + 1})</span> {answerKey[index] || 'A'}
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Not: Bu bölüm PDF'de gözükmeyecektir.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeyimlerPDF;
