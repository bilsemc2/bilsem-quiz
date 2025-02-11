import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXPCheck } from '../../../hooks/useXPCheck';
import XPWarning from '../../../components/XPWarning';
import { useUser } from '../../../hooks/useUser';

type Operator = '+' | '-';
type FeedbackType = { message: string; isCorrect: boolean } | null;

// Rastgele sayı üretme fonksiyonu (min ve max dahil)
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Operatörler
const operators: Operator[] = ['+', '-'];

export default function MathProblem() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [choices, setChoices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [showHint, setShowHint] = useState(false);

  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!userLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, userLoading, navigate]);

  if (!currentUser) {
    return null; // Yönlendirme yapılırken boş ekran göster
  }

  // İşlem sonucunu hesaplama
  const calculateResult = (nums: number[]): number => {
    // Farklı kombinasyonlardan en büyük sonucu seç
    const results = [
      (nums[0] + nums[2]) - nums[1],  // İlk ve son toplanıp ortadaki çıkarılır
      (nums[0] - nums[1]) + nums[2],  // Soldan sağa işlem
      nums[2] - nums[0] + nums[1],    // Sondan başa işlem
    ];
    
    // En büyük sonucu döndür (bu bizim doğru cevabımız olacak)
    return Math.max(...results);
  };

  // Seçenekleri oluştur
  const generateChoices = (result: number): number[] => {
    const choices = new Set<number>();
    choices.add(result); // Doğru cevabı ekle (en büyük sonuç)

    // Diğer olası sonuçları ve yakın sayıları ekle
    while (choices.size < 5) {
      const offset = getRandomInt(-3, 3);
      const newChoice = result + offset;
      
      // Sadece pozitif ve farklı sayıları ekle
      if (newChoice > 0 && !choices.has(newChoice)) {
        choices.add(newChoice);
      }
    }

    // Diziyi karıştır
    return Array.from(choices).sort(() => Math.random() - 0.5);
  };

  // Yeni problem oluştur
  const generateNewProblem = () => {
    // 1-10 arası 3 rastgele sayı üret
    const newNumbers = Array.from({length: 3}, () => getRandomInt(1, 10));
    
    // Sonucu hesapla
    const result = calculateResult(newNumbers);
    
    // Eğer sonuç negatif veya çok büyükse yeniden üret
    if (result < 0 || result > 20) {
      generateNewProblem();
      return;
    }

    // Seçenekleri oluştur
    const newChoices = generateChoices(result);

    setNumbers(newNumbers);
    setChoices(newChoices);
    setFeedback(null);
    setShowHint(false);
  };

  // Sayfa yüklendiğinde yeni problem oluştur
  useEffect(() => {
    generateNewProblem();
  }, []);

  const handleChoiceSelected = (choice: number) => {
    const result = calculateResult(numbers);
    const isCorrect = choice === result;

    if (isCorrect) {
      setFeedback({
        message: `✅ Doğru! ${numbers[0]}+${numbers[2]}-${numbers[1]}=${result} işleminin sonucu ${result} eder.`,
        isCorrect: true
      });
    } else {
      setFeedback({
        message: `❌ Yanlış! ${numbers[0]}+${numbers[2]}-${numbers[1]}=${result} işleminin sonucu ${result} eder.`,
        isCorrect: false
      });
    }

    // 2 saniye sonra yeni soru
    setTimeout(generateNewProblem, 2000);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  if (userLoading || xpLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center">
        <div className="text-2xl font-semibold">Yükleniyor...</div>
      </div>
    );
  }

  if (!hasEnoughXP) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <XPWarning
          requiredXP={requiredXP}
          currentXP={userXP}
          title="Bu oyunu oynamak için yeterli XP'niz yok"
        />
      </div>
    );
  }

  if (numbers.length === 0 || choices.length === 0) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Matematik Problemi</h1>
      </div>

      <div className="text-4xl font-bold mb-8 text-center py-8 bg-blue-50 rounded-lg">
        Verilen sayılar: {numbers.join(', ')} <br/>
        Operatörler: {operators.join(', ')}
      </div>

      <div className="mb-4 text-lg text-center">
        <p>Bu sayı ve operatörleri kullanarak hangi sonuca ulaşabiliriz?</p>
        <p className="text-sm text-gray-600 mt-2">
          İpucu: Sayıları istediğiniz sırayla işleyebilirsiniz. En büyük sonucu bulun!
        </p>
        <button 
          onClick={toggleHint}
          className="mt-2 text-blue-500 hover:text-blue-700 underline"
        >
          {showHint ? 'İpucunu Gizle' : 'Nasıl Düşünmeliyim?'}
        </button>
      </div>

      {showHint && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg text-sm">
          <h3 className="font-bold mb-2">Düşünme Adımları:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Sayıları farklı sıralarda kullanarak denemeler yapın</li>
            <li>Örnek stratejiler:</li>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>İlk ve son sayıyı toplayıp ortadakini çıkarın</li>
              <li>Soldan sağa doğru işlem yapın</li>
              <li>Sondan başa doğru işlem yapın</li>
            </ul>
            <li>Bulduğunuz sonuçlar arasından en büyük olanı seçin</li>
            <li>Bu sonuç seçeneklerden biri olmalı</li>
          </ol>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {choices.map((ch, idx) => (
          <button
            key={idx}
            onClick={() => handleChoiceSelected(ch)}
            className="p-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-3xl font-bold"
          >
            {ch}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`mt-6 text-2xl font-bold text-center ${feedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
