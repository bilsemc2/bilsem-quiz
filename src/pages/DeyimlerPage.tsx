import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { BookOpen, Search, FileText } from 'lucide-react';
import DeyimlerPDF from '../components/DeyimlerPDF';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';

interface Deyim {
  id: number;
  deyim: string;
  aciklama: string;
  ornek: string | null;
}

interface GameState {
  currentDeyim: Deyim | null;
  options: string[];
  score: number;
  answered: boolean;
  selectedAnswer: string;
}

const DeyimlerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasEnoughXP } = useXPCheck();

  const [deyimler, setDeyimler] = useState<Deyim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [mode, setMode] = useState<'liste' | 'oyun' | 'pdf'>('liste');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 12;
  const [userXP, setUserXP] = useState<number>(0);

  const QUESTIONS_PER_GAME = 10; // Her oyunda sorulacak soru sayısı

  const [gameState, setGameState] = useState<GameState>({
    currentDeyim: null,
    options: [],
    score: 0,
    answered: false,
    selectedAnswer: '',
  });

  const [gameDeyimler, setGameDeyimler] = useState<Deyim[]>([]);

  // Deyimleri yükle
  const fetchDeyimler = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('deyimler')
        .select('*', { count: 'exact' });

      // Eğer arama terimi varsa filtreleme uygula
      if (debouncedSearchTerm) {
        query = query.ilike('deyim', `%${debouncedSearchTerm}%`);
      }

      // Önce toplam kayıt sayısını al
      const { count } = await query;
      setTotalCount(count || 0);

      // Sayfalanmış veriyi getir
      const { data, error } = await query
        .order('id')
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setDeyimler(data || []);
    } catch (error) {
      toast.error('Deyimler yüklenirken bir hata oluştu');
      console.error('Deyimler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Arama terimi için debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms bekle

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sayfa veya arama değiştiğinde deyimleri yeniden yükle
  useEffect(() => {
    fetchDeyimler();
  }, [currentPage, debouncedSearchTerm]);

  // Kullanıcı kontrolü ve yönlendirme
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Kullanıcı XP bilgisini yükle
  useEffect(() => {
    const fetchUserXP = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('experience')
            .eq('id', user.id)
            .single();
          if (error) throw error;
          setUserXP(data?.experience || 0);
        } catch (error) {
          console.error('XP bilgisi alınırken hata:', error);
        }
      }
    };
    fetchUserXP();
  }, [user]);

  // Oyun modunu başlatma
  const startGame = async () => {
    try {
      // Tüm deyimleri getir
      const { data: allDeyimler, error } = await supabase
        .from('deyimler')
        .select('*');

      if (error) throw error;

      if (!allDeyimler || allDeyimler.length < 4) {
        toast.error('Oyun için yeterli deyim bulunmuyor');
        return;
      }

      // Deyimleri karıştır ve ilk 10 tanesini al
      const shuffledDeyimler = [...allDeyimler]
        .sort(() => Math.random() - 0.5)
        .slice(0, QUESTIONS_PER_GAME);
      
      setGameDeyimler(shuffledDeyimler);
      setGameState(prev => ({ ...prev, score: 0 })); // Skoru sıfırla
      setMode('oyun');
      loadNewQuestion();
    } catch (error) {
      console.error('Oyun başlatılırken hata:', error);
      toast.error('Oyun başlatılırken bir hata oluştu');
    }
  };

  // Yeni bir soru yükleme
  const loadNewQuestion = () => {
    // Oyun bitti mi kontrol et
    if (gameState.score >= QUESTIONS_PER_GAME) {
      toast.success(`Tebrikler! ${gameState.score} puan kazandın! 🎉`);
      setMode('liste');
      return;
    }

    // Sıradaki soruyu seç
    const currentDeyim = gameDeyimler[gameState.score];
    
    // Eğer currentDeyim yoksa oyunu bitir
    if (!currentDeyim) {
      toast.error('Beklenmeyen bir hata oluştu');
      setMode('liste');
      return;
    }

    // Mevcut deyimi çıkarıp diğer deyimlerden yanlış şıkları oluştur
    const otherDeyimler = gameDeyimler.filter(d => d.id !== currentDeyim.id);
    
    // En az 3 yanlış şık olduğundan emin ol
    if (otherDeyimler.length < 3) {
      toast.error('Yeterli sayıda deyim yok');
      setMode('liste');
      return;
    }

    // Rastgele 3 yanlış seçenek oluştur
    const wrongOptions = otherDeyimler
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(d => d.aciklama);

    // Doğru seçeneği da ekleyip karıştır
    const options = [...wrongOptions, currentDeyim.aciklama].sort(
      () => Math.random() - 0.5
    );

    setGameState(prev => ({
      ...prev,
      currentDeyim: currentDeyim,
      options,
      answered: false,
      selectedAnswer: '',
    }));
  };

  // Kullanıcının XP güncelleme işlemi
  const updateUserXP = async (xpAmount: number) => {
    if (!user) return;
    try {
      // Mevcut XP bilgisini getir
      const { data: userData, error: fetchError } = await supabase
        .from('profiles')
        .select('experience')
        .eq('id', user.id)
        .single();
      if (fetchError) throw fetchError;

      const currentXP = userData?.experience || 0;
      const newXP = currentXP + xpAmount;

      // XP güncellemesi yap
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ experience: newXP })
        .eq('id', user.id);
      if (updateError) throw updateError;

      toast.success(`+${xpAmount} XP Kazandın! 🎉`);
      setUserXP(newXP);
    } catch (error) {
      console.error('XP güncellenirken hata:', error);
      toast.error('XP güncellenirken bir hata oluştu');
    }
  };

  // Cevap kontrolü
  const handleAnswer = async (answer: string) => {
    if (gameState.answered) return;

    const isCorrect = answer === gameState.currentDeyim?.aciklama;
    setGameState(prev => ({
      ...prev,
      answered: true,
      selectedAnswer: answer,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));

    if (isCorrect) {
      toast.success('Doğru cevap! 🎉');
      await updateUserXP(10); // Doğru cevap için 10 XP
    } else {
      toast.error('Yanlış cevap. Tekrar deneyin!');
    }

    // 2 saniye sonra yeni soruya geç
    setTimeout(loadNewQuestion, 2000);
  };

  // Arama yapıldığında ilk sayfaya dön
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // XP kontrolü: yeterli XP yoksa XP uyarı bileşenini göster
  if (!hasEnoughXP) {
    return (
      <XPWarning
        title="Deyimler Dünyası"
        requiredXP={1000}
        currentXP={userXP}
      />
    );
  }

  // Yüklenme durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8">
      <div className="container mx-auto px-4">
        {/* Başlık ve Menü */}
        <header className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Deyimler Dünyası
                </h1>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Ana Menü
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('liste')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  mode === 'liste'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Deyimler Listesi
              </button>
              <button
                onClick={startGame}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  mode === 'oyun'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Oyun Modu
              </button>
              <button
                onClick={() => setMode('pdf')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  mode === 'pdf'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  PDF Oluştur
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* İçerik */}
        {mode === 'liste' ? (
          <>
            {/* Arama Alanı */}
            <div className="relative mb-8">
              <input
                type="text"
                placeholder="Deyim veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 bg-white rounded-xl shadow-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Deyimler Listesi */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deyimler.map((deyim) => (
                    <motion.div
                      key={deyim.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {deyim.deyim}
                      </h3>
                      <p className="text-gray-600">{deyim.aciklama}</p>
                      {deyim.ornek && (
                        <p className="mt-2 text-sm text-gray-500 italic">
                          "{deyim.ornek}"
                        </p>
                      )}
                    </motion.div>
                  ))}
              </div>

              {/* Sayfalama */}
              {totalCount > ITEMS_PER_PAGE && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                  >
                    Önceki
                  </button>
                  <span className="text-gray-600">
                    Sayfa {currentPage} / {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(prev =>
                        Math.min(prev + 1, Math.ceil(totalCount / ITEMS_PER_PAGE))
                      )
                    }
                    disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </div>
          </>
        ) : mode === 'pdf' ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl mx-auto">
            <DeyimlerPDF deyimler={deyimler} />
          </div>
        ) : (
          // Oyun Modu
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            {/* Oyun Açıklaması */}
            <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                Oyun Hakkında
              </h3>
              <ul className="space-y-2 text-amber-700">
                <li>• Şu anda Deyimler listesindeki bulunduğunuz sayfadaki deyimlerden sorular gelecektir.</li>
                <li>• Toplam 10 soru sorulacaktır.</li>
                <li>• Her doğru cevap için 10 XP kazanırsınız.</li>
                <li>• Oyun sonunda toplam puanınız gösterilecektir.</li>
                <li className="font-medium">• Mevcut Skor: {gameState.score} / {QUESTIONS_PER_GAME}</li>
              </ul>
            </div>
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 inline-block mb-4">
                <h2 className="text-2xl font-bold text-amber-800">
                  {gameState.currentDeyim?.deyim}
                </h2>
              </div>
              <p className="text-gray-600">Bu deyimin anlamı nedir?</p>
              <div className="mt-4 text-lg font-semibold text-amber-600">
                Skor: {gameState.score}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  disabled={gameState.answered}
                  className={`p-4 rounded-xl text-left transition-all ${
                    gameState.answered
                      ? option === gameState.currentDeyim?.aciklama
                        ? 'bg-green-100 border-2 border-green-500'
                        : option === gameState.selectedAnswer
                        ? 'bg-red-100 border-2 border-red-500'
                        : 'bg-gray-100'
                      : 'bg-gray-100 hover:bg-amber-100'
                  }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeyimlerPage;