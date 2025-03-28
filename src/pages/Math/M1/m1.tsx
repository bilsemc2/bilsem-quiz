import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXPCheck } from '../../../hooks/useXPCheck';
import XPWarning from '../../../components/XPWarning';
import { useUser } from '../../../hooks/useUser';

// Kullanılan tipler
type FeedbackInfo = { message: string; isCorrect: boolean };

// Rastgele sayı üretme fonksiyonu (min ve max dahil)
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Gerekli XP (Hook'un nasıl çalıştığına bağlı olarak kullanılır veya kullanılmaz)
// const MATH_PROBLEM_REQUIRED_XP = 5;

export default function MathProblem() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [choices, setChoices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackInfo | null>(null);
  const [showHint, setShowHint] = useState(false);

  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  // İstek üzerine useXPCheck değiştirilmedi, ancak 'false' kullanımı genellikle
  // hook'un beklenen çalışmasıyla tutarlı olmayabilir.
  const { hasEnoughXP, userXP, loading: xpLoading, requiredXP } = useXPCheck(false);

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!userLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, userLoading, navigate]);

  // --- Hesaplama Mantığı ---

  // *** YENİ calculateResult: Sadece BİR '+' ve BİR '-' Kullanarak Max Sonuç ***
  const calculateResult = useCallback((nums: number[]): number => {
    if (nums.length !== 3) return 0;
    const [a, b, c] = nums;

    // Sadece bir '+' ve bir '-' içeren tüm permütasyonları hesapla
    const possibleResults = new Set<number>();

    // Sayı Permütasyonları
    const permutations = [
      [a, b, c], [a, c, b], [b, a, c],
      [b, c, a], [c, a, b], [c, b, a]
    ];

    // Her permütasyon için (+, -) ve (-, +) operatörlerini dene
    permutations.forEach(([n1, n2, n3]) => {
      possibleResults.add(n1 + n2 - n3); // (+, -)
      possibleResults.add(n1 - n2 + n3); // (-, +)
    });

    // Hesaplanan tüm benzersiz sonuçlar arasından en büyüğünü bul
    if (possibleResults.size === 0) return 0; // Normalde olmaz ama güvenlik kontrolü
    // Eğer tüm sonuçlar negatifse, Math.max negatif en büyüğü döndürür.
    return Math.max(...Array.from(possibleResults));

  }, []); // Bağımlılığı yok

  // Seçenekleri oluştur (Değişiklik yok, en büyük sonucu baz alıyor)
  const generateChoices = (correctResult: number): number[] => {
    const choicesSet = new Set<number>();
    choicesSet.add(correctResult);

    while (choicesSet.size < 5) {
      // Offset aralığı, sonucun negatif olabileceği düşünülerek ayarlanabilir
      const range = Math.max(3, Math.abs(Math.floor(correctResult * 0.4))); // Mutlak değerin %40'ı
      const offset = getRandomInt(-range, range);
      if (offset === 0 && choicesSet.size > 1) continue;
      const newChoice = correctResult + offset;
      // Artık negatif seçenekler de olabilir, 0 kontrolü kaldırıldı
      if (!choicesSet.has(newChoice)) {
        choicesSet.add(newChoice);
      }
    }
    return Array.from(choicesSet).sort(() => Math.random() - 0.5);
  };

  // --- Problem Üretme ve Yönetim ---

  const generateNewProblem = useCallback(() => {
    let validProblemFound = false;
    let attempts = 0;
    let newNumbers: number[] = [];
    let result = 0;
    const MAX_ATTEMPTS = 30;
    // Sonuç aralığı güncellendi (örn: 10+9-1 = 18, 1+2-10 = -7)
    const MAX_RESULT = 20;
    const MIN_RESULT = -10;

    while (!validProblemFound && attempts < MAX_ATTEMPTS) {
      newNumbers = Array.from({ length: 3 }, () => getRandomInt(1, 10));
      result = calculateResult(newNumbers); // Güncellenmiş calculateResult

      // Sonucun makul bir aralıkta olmasını ve sayılardan birine eşit olmamasını sağla (çok basit olmasın)
      if (result >= MIN_RESULT && result <= MAX_RESULT && !newNumbers.includes(result)) {
         // Ayrıca, sonucun çok bariz olmamasını sağlamak için ek kontroller eklenebilir
         // Örneğin, a+b-c = a veya a+b-c = b gibi durumları elemek
         const [a,b,c] = newNumbers;
         if( a+b-c !== a && a+b-c !==b && a+c-b !== a && a+c-b !== c && b+c-a !== b && b+c-a !==c &&
             a-b+c !== a && a-b+c !==c && a-c+b !== a && a-c+b !==b && b-a+c !== b && b-a+c !==c)
         {
            validProblemFound = true;
         }
      }
      attempts++;
    }

    if (!validProblemFound) {
      newNumbers = [4, 1, 8]; // Örnek: 8+4-1=11, 8-4+1=5, 4-1+8=11 => Max 11
      result = calculateResult(newNumbers);
    }

    const newChoices = generateChoices(result);

    setNumbers(newNumbers);
    setChoices(newChoices);
    setFeedback(null);
    setShowHint(false);
  }, [calculateResult]);

  // İlk problem oluşturma (Değişiklik yok)
  useEffect(() => {
    if (currentUser && hasEnoughXP) {
      generateNewProblem();
    }
  }, [currentUser, generateNewProblem, hasEnoughXP]);

  // --- Kullanıcı Etkileşimi ---

  const handleChoiceSelected = useCallback((choice: number) => {
    if (feedback) return;
    const correctResult = calculateResult(numbers); // Güncellenmiş calculateResult
    const isCorrect = choice === correctResult;

    if (isCorrect) {
       // Feedback mesajı güncellendi
      setFeedback({ message: `✅ Doğru! (+ ve - kullanarak) en büyük sonuç ${correctResult}.`, isCorrect: true });
      // TODO: XP ekleme vb.
    } else {
       // Feedback mesajı güncellendi
      setFeedback({ message: `❌ Yanlış! (+ ve - kullanarak) doğru sonuç ${correctResult} olmalıydı.`, isCorrect: false });
    }

    const timer = setTimeout(generateNewProblem, 2000);
    return () => clearTimeout(timer);
  }, [numbers, calculateResult, generateNewProblem, feedback]);

  const toggleHint = useCallback(() => {
    setShowHint(prev => !prev);
  }, []);

  // --- Render Koşulları (Değişiklik yok) ---
    if (userLoading || xpLoading) {
        return ( <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center"><div className="text-2xl font-semibold">Yükleniyor...</div></div> );
    }
    if (!currentUser) { return null; }
    // XP kontrolü (useXPCheck(false) hala kullanılıyor)
    if (!hasEnoughXP) {
        return ( <div className="flex items-center justify-center min-h-screen"><XPWarning requiredXP={requiredXP} currentXP={userXP} title="Bu oyunu oynamak için yeterli XP'niz yok"/></div> );
    }
    if (numbers.length === 0 || choices.length === 0) {
        return ( <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center"><div className="text-2xl font-semibold">Problem Oluşturuluyor...</div></div> );
    }

  // --- Ana JSX ---

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">Matematik Problemi</h1>

      {/* Problem Alanı (Değişiklik yok) */}
      <div className="text-center p-6 bg-indigo-50 rounded-lg mb-6 border border-indigo-100">
        <p className="text-lg text-gray-700 mb-2">Verilen Sayılar:</p>
        <p className="text-5xl font-bold text-indigo-600 tracking-wider mb-4">{numbers.join('  •  ')}</p>
        <p className="text-sm text-gray-500">(Operatörler: +, -)</p>
      </div>

      {/* Açıklama (Güncellendi) */}
      <div className="mb-6 text-center text-gray-800">
         {/* *** YENİ AÇIKLAMA *** */}
        <p className="text-xl mb-3">Verilen 3 sayıyı, **bir toplama (+) ve bir çıkarma (-) işlemi kullanarak** elde edebileceğiniz <strong className='text-indigo-700'>en büyük sonuç</strong> kaçtır?</p>
        <button
          onClick={toggleHint}
          className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
          aria-expanded={showHint}
        >
          {showHint ? 'İpucunu Gizle' : 'Nasıl Düşünmeliyim? (İpucu)'}
        </button>
      </div>

      {/* İpucu Detayı (Hint Metni Güncellendi) */}
      {showHint && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900 transition-opacity duration-300 ease-in-out">
          <h3 className="font-semibold mb-2 text-base">Düşünme Adımları:</h3>
          {/* *** YENİ HINT *** */}
          <p className="mb-2">Bu problemde, sayıları kullanarak ve **tam olarak bir toplama (+) ve bir çıkarma (-) işlemi yaparak** mümkün olan en büyük sonucu bulmanız gerekiyor.</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Sayıların sırasını değiştirerek farklı sonuçlar elde edebilirsiniz.</li>
              <li>Örnek denemeler: <code className="bg-yellow-100 px-1 rounded">{numbers[0]} + {numbers[1]} - {numbers[2]}</code> veya <code className="bg-yellow-100 px-1 rounded">{numbers[0]} - {numbers[1]} + {numbers[2]}</code> gibi yapıları, sayıların tüm farklı sıralamaları (<code className="bg-yellow-100 px-1 rounded">{numbers[1]} + {numbers[2]} - {numbers[0]}</code> vb.) için deneyin.</li>
              <li>Genellikle en büyük iki sayıyı toplamak ve en küçüğü çıkarmak iyi bir strateji olabilir, ama her zaman en iyi sonucu vermeyebilir!</li>
          </ul>
           <p className="mt-2">Yaptığınız tüm bu <strong className="font-semibold">(+,-)</strong> kombinasyonları sonucunda bulduğunuz <strong className="font-semibold">en büyük değer</strong> hangi seçenekteyse onu işaretleyin.</p>
        </div>
      )}

      {/* Seçenekler (Değişiklik yok) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {choices.map((choice, idx) => (
          <button
            key={idx}
            onClick={() => handleChoiceSelected(choice)}
            disabled={!!feedback}
            className={`p-5 text-3xl font-bold text-white rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              feedback
                ? feedback.isCorrect && choice === calculateResult(numbers)
                  ? 'bg-green-500 cursor-not-allowed'
                  : !feedback.isCorrect && choice === calculateResult(numbers)
                    ? 'bg-green-400 opacity-70 cursor-not-allowed'
                    : 'bg-gray-400 opacity-50 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>

      {/* Geri Bildirim (Mesajlar güncellendi) */}
      {feedback && (
        <div className={`mt-6 py-3 px-4 rounded-lg text-center text-xl font-semibold shadow ${feedback.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}