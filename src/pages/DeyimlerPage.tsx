import { useState, useEffect, useRef } from 'react'; // useRef eklendi
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { BookOpen, Search, FileText } from 'lucide-react';
import DeyimlerPDF from '../components/DeyimlerPDF';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

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
  missingWord?: string;
  deyimWords?: string[];
  missingWordIndex?: number;
  targetWord?: string;
}

const DeyimlerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPagePath = location.pathname;

  const [deyimler, setDeyimler] = useState<Deyim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [mode, setMode] = useState<'liste' | 'oyun' | 'pdf' | 'tamamlama' | 'hafiza'>('liste');
  const [showingDeyim, setShowingDeyim] = useState(true);
  const [timer, setTimer] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 12;
  const [userXP, setUserXP] = useState<number>(0);

  const [isProcessingXP, setIsProcessingXP] = useState(false);
  const [xpProcessingError, setXpProcessingError] = useState<string | null>(null);
  const [pageRequiredXP, setPageRequiredXP] = useState<number | null>(null);

  // --- Çift Çalışmayı Önleme Ref'i ---
  // Bu ref, XP düşürme işleminin bu sayfa ziyareti için zaten başlatılıp başlatılmadığını takip eder.
  // State yerine ref kullanıyoruz çünkü bu değerin değişimi yeniden render tetiklememeli.
  const xpDeductionAttemptedRef = useRef(false);
  // --- Bitiş: Çift Çalışmayı Önleme Ref'i ---


  const QUESTIONS_PER_GAME = 10;

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
      let query = supabase
        .from('deyimler')
        .select('*', { count: 'exact' });

      if (debouncedSearchTerm) {
        query = query.ilike('deyim', `%${debouncedSearchTerm}%`);
      }

      const { count, error: countError } = await query;
      if (countError) throw countError;
      setTotalCount(count || 0);

      const { data, error } = await query
        .order('id')
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setDeyimler(data || []);
    } catch (error: any) {
      toast.error('Deyimler yüklenirken bir hata oluştu');
      console.error('Deyimler yüklenirken hata:', error);
    }
  };

  // Arama terimi için debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sayfa veya arama değiştiğinde deyimleri yeniden yükle
  useEffect(() => {
    if (mode === 'liste' && !loading) {
        fetchDeyimler();
    }
  }, [currentPage, debouncedSearchTerm, mode, loading]);

  // Oyun deyimleri yüklendiğinde yeni soru yükle
  useEffect(() => {
    if (mode === 'oyun' && gameDeyimler.length > 0 && gameState.currentDeyim === null) {
       loadNewQuestion();
    }
  }, [gameDeyimler, mode, gameState.currentDeyim]);

  // Kullanıcı kontrolü ve yönlendirme
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Kullanıcı değiştiğinde veya sayfa ilk yüklendiğinde XP düşürme denemesini sıfırla
    xpDeductionAttemptedRef.current = false;
  }, [user, navigate]);

  // Kullanıcı XP bilgisini yükle
  useEffect(() => {
    const fetchInitialUserXP = async () => {
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
          console.error('Başlangıç XP bilgisi alınırken hata:', error);
        }
      }
    };
    fetchInitialUserXP();
  }, [user]);

  // --- Sayfa Ziyareti İçin XP Azaltma useEffect (Güncellendi) ---
  useEffect(() => {
    const deductXpForPageVisit = async () => {
      // --- Çift Çalışma Kontrolü ---
      if (xpDeductionAttemptedRef.current) {
          console.log("XP deduction already attempted for this visit.");
          // Eğer işlem zaten denendiyse ve hala yükleniyorsa, bitir.
          // Bu, StrictMode'un ikinci çalıştırmasında gereksiz bekleme olmasını engeller.
          if (loading) setLoading(false);
          return;
      }
      // --- Bitiş: Çift Çalışma Kontrolü ---

      if (!user) return;

      // İşlemin denendiğini işaretle
      xpDeductionAttemptedRef.current = true;

      console.log(`Checking XP requirement for page: ${currentPagePath}`);
      setLoading(true);
      setIsProcessingXP(true);
      setXpProcessingError(null);
      setPageRequiredXP(null);

      let shouldFetchDeyimler = true;

      try {
        const { data: requirement, error: reqError } = await supabase
          .from('xp_requirements')
          .select('required_xp')
          .eq('page_path', currentPagePath)
          .maybeSingle();

        if (reqError) {
          throw new Error(`XP gereksinimi alınamadı: ${reqError.message}`);
        }

        if (!requirement || !requirement.required_xp || requirement.required_xp <= 0) {
          console.log(`Sayfa ${currentPagePath} için XP azaltma gereksinimi bulunmuyor.`);
        } else {
          const xpToDeduct = requirement.required_xp;
          setPageRequiredXP(xpToDeduct);
          console.log(`Requirement found: ${xpToDeduct} XP for ${currentPagePath}`);

          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('experience')
            .eq('id', user.id)
            .single();

          if (profileErr) throw new Error(`Profil alınamadı: ${profileErr.message}`);
          if (!profileData) throw new Error(`Profil bulunamadı (ID: ${user.id}).`);

          const currentExperience = profileData.experience ?? 0;
          setUserXP(currentExperience);

          if (currentExperience < xpToDeduct) {
            console.warn(`Yetersiz XP (${currentExperience}) for page ${currentPagePath} requiring ${xpToDeduct} XP.`);
            setXpProcessingError(`Bu sayfayı ziyaret etmek için yeterli XP'niz (${currentExperience}) yok. Gereken: ${xpToDeduct} XP.`);
            shouldFetchDeyimler = false;
          } else {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const reasonForVisit = `Sayfa ziyareti: ${currentPagePath}`;
            const { count: recentLogCount, error: recentLogError } = await supabase
                .from('experience_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('change_reason', reasonForVisit)
                .gte('changed_at', fiveMinutesAgo);

            if (recentLogError){
                 console.warn("Recent log check failed, proceeding with deduction:", recentLogError.message);
            } else if (recentLogCount !== null && recentLogCount > 0) {
                console.log(`Son 5dk içinde ${currentPagePath} ziyareti için XP düşülmüş, tekrar düşülmüyor.`);
            } else {
              const newExperience = currentExperience - xpToDeduct;
              console.log(`Updating XP for user ${user.id}: ${currentExperience} -> ${newExperience}`);
              const { error: updateErr } = await supabase
                .from('profiles')
                .update({ experience: newExperience })
                .eq('id', user.id);

              if (updateErr) {
                 if (updateErr.message.includes("violates row-level security policy")) {
                     console.error("RLS Error updating profile XP.");
                     throw new Error(`Profil XP güncellenemedi: Yetki Hatası (RLS).`);
                 } else {
                     throw new Error(`XP güncellenemedi: ${updateErr.message}`);
                 }
              }

              console.log(`Logging XP change for user ${user.id}`);
              const { error: logErr } = await supabase
                .from('experience_log')
                .insert({
                  user_id: user.id,
                  change_amount: -xpToDeduct,
                  old_experience: currentExperience,
                  new_experience: newExperience,
                  change_reason: reasonForVisit
                });

              if (logErr) {
                console.error("Deneyim loglama hatası (Sayfa Ziyareti):", logErr);
                 if (logErr.message.includes("violates row-level security policy")) {
                     setXpProcessingError("XP düşüldü ancak işlem kaydedilemedi (Yetki Hatası).");
                 } else {
                     setXpProcessingError("XP düşüldü ancak işlem kaydedilemedi.");
                 }
              } else {
                  console.log(`Successfully deducted ${xpToDeduct} XP and logged for visiting ${currentPagePath}.`);
                  // --- Toast Mesajı Sadece Başarılı Loglamadan Sonra ---
                  toast.success(`Sayfa ziyareti için ${xpToDeduct} XP düşüldü.`);
                  setUserXP(newExperience);
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Sayfa ziyareti XP azaltma işlemi sırasında hata:", error);
        setXpProcessingError(error.message || "Bilinmeyen bir hata oluştu.");
        shouldFetchDeyimler = false;
      } finally {
        setIsProcessingXP(false);
        if (shouldFetchDeyimler) {
          await fetchDeyimler();
        }
        setLoading(false);
      }
    };

    // Sadece kullanıcı varsa ve XP düşürme işlemi *bu render döngüsünde* henüz denenmediyse başlat
    if (user && !xpDeductionAttemptedRef.current) {
        deductXpForPageVisit();
    } else if (!user) {
        setLoading(false); // Kullanıcı yoksa yüklemeyi bitir
    }

    // Component unmount edildiğinde ref'i sıfırlamaya gerek yok,
    // çünkü sayfa tekrar mount edildiğinde zaten false olarak başlayacak.

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPagePath]); // Bağımlılıklar aynı kalmalı
  // --- Bitiş: Sayfa Ziyareti İçin XP Azaltma useEffect ---


  // Oyun modunu başlatma fonksiyonları (startHafizaGame, startTamamlamaGame, startGame)
  // Bu fonksiyonlar önceki haliyle aynı kalır.
  const startHafizaGame = async () => {
    try {
      if (timer) { clearTimeout(timer); setTimer(null); }
      const { data: allDeyimler, error } = await supabase.from('deyimler').select('*');
      if (error) throw error;
      if (!allDeyimler || allDeyimler.length < 4) { toast.error('Oyun için yeterli deyim bulunmuyor'); return; }
      const randomDeyim = allDeyimler[Math.floor(Math.random() * allDeyimler.length)];
      const words = randomDeyim.deyim.split(' ');
      const randomIndex = Math.floor(Math.random() * words.length);
      const targetWord = words[randomIndex];
      const otherWords = allDeyimler.filter(d => d.id !== randomDeyim.id).map(d => d.deyim.split(' ')).flat().filter(word => word.length > 2).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...otherWords, targetWord].sort(() => Math.random() - 0.5);
      setGameState({ currentDeyim: randomDeyim, options, score: 0, answered: false, selectedAnswer: '', targetWord });
      setShowingDeyim(true); setMode('hafiza');
      const newTimer = window.setTimeout(() => { setShowingDeyim(false); }, 5000); setTimer(newTimer);
    } catch (error) { console.error('Oyun başlatılırken hata:', error); toast.error('Oyun başlatılırken bir hata oluştu'); }
  };
  const startTamamlamaGame = async () => {
    try {
      const { data: allDeyimler, error } = await supabase.from('deyimler').select('*');
      if (error) throw error;
      if (!allDeyimler || allDeyimler.length < 4) { toast.error('Oyun için yeterli deyim bulunmuyor'); return; }
      const randomDeyim = allDeyimler[Math.floor(Math.random() * allDeyimler.length)];
      const words = randomDeyim.deyim.split(' ');
      const randomIndex = Math.floor(Math.random() * words.length);
      const missingWord = words[randomIndex];
      const otherWords = allDeyimler.filter(d => d.id !== randomDeyim.id).map(d => d.deyim.split(' ')).flat().filter(word => word.length > 2).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...otherWords, missingWord].sort(() => Math.random() - 0.5);
      setGameState({ currentDeyim: randomDeyim, options, score: 0, answered: false, selectedAnswer: '', missingWord, deyimWords: words, missingWordIndex: randomIndex });
      setMode('tamamlama');
    } catch (error) { console.error('Oyun başlatılırken hata:', error); toast.error('Oyun başlatılırken bir hata oluştu'); }
  };
  const startGame = async () => {
    try {
      const { data: allDeyimler, error } = await supabase.from('deyimler').select('*');
      if (error) throw error;
      if (!allDeyimler || allDeyimler.length < 4) { toast.error('Oyun için yeterli deyim bulunmuyor'); return; }
      const shuffledDeyimler = [...allDeyimler].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_GAME);
      setGameDeyimler(shuffledDeyimler);
      setGameState(prev => ({ ...prev, score: 0, currentDeyim: null })); // Skoru sıfırla ve ilk soruyu null yap
      setMode('oyun');
    } catch (error) { console.error('Oyun başlatılırken hata:', error); toast.error('Oyun başlatılırken bir hata oluştu'); }
  };


  // Yeni bir soru yükleme fonksiyonu (loadNewQuestion)
  // Bu fonksiyon önceki haliyle aynı kalır.
  const loadNewQuestion = () => {
    if (gameState.score >= QUESTIONS_PER_GAME) { toast.success(`Tebrikler! ${gameState.score} puan kazandın! 🎉`); setMode('liste'); return; }
    const currentDeyimIndex = gameState.score; // Mevcut skora göre index al
    const currentDeyim = gameDeyimler[currentDeyimIndex];
    if (!currentDeyim) { console.error(`Deyim bulunamadı, index: ${currentDeyimIndex}`); toast.error('Beklenmeyen bir hata oluştu'); setMode('liste'); return; }
    const otherDeyimler = gameDeyimler.filter(d => d.id !== currentDeyim.id);
    if (otherDeyimler.length < 3) {
        supabase.from('deyimler').select('aciklama').neq('id', currentDeyim.id).limit(100)
        .then(({ data, error }) => {
            if(error || !data || data.length < 3) {
                toast.error('Yeterli sayıda farklı deyim açıklaması bulunamadı.');
                setMode('liste');
                return;
            }
            const wrongOptions = data.map(d => d.aciklama).sort(() => Math.random() - 0.5).slice(0, 3);
            const options = [...wrongOptions, currentDeyim.aciklama].sort(() => Math.random() - 0.5);
            setGameState(prev => ({ ...prev, currentDeyim: currentDeyim, options, answered: false, selectedAnswer: '' }));
        });
    } else {
        const wrongOptions = otherDeyimler.sort(() => Math.random() - 0.5).slice(0, 3).map(d => d.aciklama);
        const options = [...wrongOptions, currentDeyim.aciklama].sort(() => Math.random() - 0.5);
        setGameState(prev => ({ ...prev, currentDeyim: currentDeyim, options, answered: false, selectedAnswer: '' }));
    }
  };


  // Cevap kontrolü - XP KAZANMA YOK
  const handleAnswer = async (answer: string) => {
    if (gameState.answered) return;

    let isCorrect;
    if (mode === 'tamamlama') {
      isCorrect = answer === gameState.missingWord;
    } else if (mode === 'hafiza') {
      isCorrect = answer === gameState.targetWord;
    } else {
      isCorrect = gameState.currentDeyim ? answer === gameState.currentDeyim.aciklama : false;
    }

    setGameState(prev => ({
      ...prev,
      answered: true,
      selectedAnswer: answer,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));

    if (isCorrect) {
      toast.success('Doğru cevap! 🎉');
    } else {
      toast.error('Yanlış cevap.');
    }

    if (mode === 'oyun') {
      const nextScore = isCorrect ? gameState.score + 1 : gameState.score;
      if (nextScore < QUESTIONS_PER_GAME) {
        setTimeout(loadNewQuestion, 1500);
      } else {
         setTimeout(() => {
             toast.success(`Oyun bitti! Toplam skorun: ${nextScore} 🎉`);
             setMode('liste');
         }, 1500);
      }
    }
  };

  // Arama yapıldığında ilk sayfaya dön
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Yetersiz XP Durumu Gösterimi
  if (!loading && xpProcessingError && pageRequiredXP && userXP < pageRequiredXP) {
     return (
       <XPWarning
         title="Deyimler Dünyası"
         requiredXP={pageRequiredXP}
         currentXP={userXP}
       />
     );
  }


  // Genel Yüklenme durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-8">
        <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-amber-700">Yükleniyor...</p>
            {isProcessingXP && <p className="text-sm text-amber-600 animate-pulse">XP durumu kontrol ediliyor...</p>}
        </div>
      </div>
    );
  }

  // --- JSX (Görünüm) Kısmı ---
  // Bu kısım öncekiyle aynı kalmalıdır.
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8">
      <div className="container mx-auto px-4">
        {/* Başlık ve Menü */}
        <header className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Sol Taraf: Başlık ve Ana Menü */}
            <div className="flex items-center gap-4 flex-wrap"> {/* flex-wrap eklendi */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Deyimler Dünyası
              </h1>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" // ml-4 kaldırıldı
              >
                Ana Menü
              </button>
               {/* Mevcut XP Göstergesi */}
               <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    XP: {userXP}
               </span>
            </div>
            {/* Sağ Taraf: Mod Butonları */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setMode('liste')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === 'liste'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Deyimler Listesi
              </button>
              <button
                onClick={startGame}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === 'oyun'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Oyun Modu
              </button>
              <button
                onClick={() => setMode('pdf')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === 'pdf'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  PDF Oluştur
                </div>
              </button>
              <button
                onClick={startTamamlamaGame}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === 'tamamlama'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Kelime Bul
              </button>
              <button
                onClick={startHafizaGame}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === 'hafiza'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Hafıza Oyunu
              </button>
            </div>
          </div>
           {/* XP İşlem Bilgisi (Başlık altında) */}
           <div className="mt-4 text-center min-h-[24px]"> {/* Hata mesajı için yer ayır */}
                {isProcessingXP && !loading && (
                    <p className="text-sm text-blue-600 animate-pulse">XP durumu kontrol ediliyor...</p>
                )}
                {xpProcessingError && !isProcessingXP && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md border border-red-200 inline-block">{xpProcessingError}</p>
                )}
           </div>
        </header>

        {/* İçerik Alanı */}
        <main>
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
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer flex flex-col h-full"
                        >
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {deyim.deyim}
                        </h3>
                        <p className="text-gray-600 text-sm flex-grow">{deyim.aciklama}</p>
                        {deyim.ornek && (
                            <p className="mt-3 text-xs text-gray-500 italic border-t pt-2">
                            "{deyim.ornek}"
                            </p>
                        )}
                        </motion.div>
                    ))}
                </div>

                {/* Sayfalama */}
                {totalCount > ITEMS_PER_PAGE && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors'}`}
                    >
                        Önceki
                    </button>
                    <span className="text-gray-600 text-sm">
                        Sayfa {currentPage} / {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    </span>
                    <button
                        onClick={() =>
                        setCurrentPage(prev =>
                            Math.min(prev + 1, Math.ceil(totalCount / ITEMS_PER_PAGE))
                        )
                        }
                        disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                        currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors'
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
                {/* Deyimler PDF bileşeni, ana sayfadan alınan deyimlerle render edilir */}
                <DeyimlerPDF deyimler={deyimler} />
            </div>
            ) : mode === 'hafiza' ? (
            // Hafıza Oyunu
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
                <div className="mb-8 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                    Hafıza Oyunu
                </h3>
                <p className="text-emerald-700 text-sm">
                    {showingDeyim
                    ? 'Deyimi ezberleyin, 5 saniye sonra bir kelimesi sorulacak!'
                    : 'Deyimde geçen kelimeyi bulun!'}
                </p>
                </div>

                <div className="text-center mb-8 min-h-[150px] flex flex-col justify-center">
                {showingDeyim ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-6 mb-4"
                    >
                    <h2 className="text-2xl font-bold text-emerald-800 mb-4">
                        {gameState.currentDeyim?.deyim}
                    </h2>
                    <p className="text-lg text-emerald-700 italic">
                        "{gameState.currentDeyim?.aciklama}"
                    </p>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h3 className="text-xl font-semibold text-emerald-800">
                        Deyimde geçen hangi kelime doğru?
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {gameState.options.map((option, index) => (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAnswer(option)}
                            disabled={gameState.answered}
                            className={`p-4 rounded-xl text-center transition-all text-sm md:text-base ${
                            gameState.answered
                                ? option === gameState.targetWord
                                ? 'bg-green-100 border-2 border-green-500 text-green-800 font-semibold'
                                : option === gameState.selectedAnswer
                                ? 'bg-red-100 border-2 border-red-500 text-red-800'
                                : 'bg-gray-100 text-gray-500'
                                : 'bg-gray-50 hover:bg-emerald-100 border border-gray-200'
                            }`}
                        >
                            {option}
                        </motion.button>
                        ))}
                    </div>
                    </motion.div>
                )}
                </div>

                {gameState.answered && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
                    <button
                    onClick={startHafizaGame}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-md"
                    >
                    Yeni Soru
                    </button>
                </motion.div>
                )}
            </div>
            ) : mode === 'tamamlama' ? (
            // Kelime Bulma Oyunu
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
                <div className="mb-8 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                    Eksik Kelimeyi Bul
                </h3>
                <p className="text-purple-700 text-sm">
                    Deyimdeki eksik kelimeyi bulun ve doğru seçeneği işaretleyin.
                </p>
                </div>

                <div className="text-center mb-8 min-h-[150px] flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-4"
                >
                    <h2 className="text-2xl font-bold text-purple-800 mb-4 leading-relaxed">
                    {gameState.deyimWords?.map((word, index) => (
                        <span key={index} className={index === gameState.missingWordIndex ? 'bg-yellow-200 px-2 py-1 rounded mx-1 font-mono text-xl' : 'mx-1'}>
                        {index === gameState.missingWordIndex ? '_____' : word}
                        </span>
                    ))}
                    </h2>
                    <p className="text-lg text-purple-700 italic">
                    "{gameState.currentDeyim?.aciklama}"
                    </p>
                </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                {gameState.options.map((option, index) => (
                    <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option)}
                    disabled={gameState.answered}
                    className={`p-4 rounded-xl text-center transition-all text-sm md:text-base ${
                        gameState.answered
                        ? option === gameState.missingWord
                            ? 'bg-green-100 border-2 border-green-500 text-green-800 font-semibold'
                            : option === gameState.selectedAnswer
                            ? 'bg-red-100 border-2 border-red-500 text-red-800'
                            : 'bg-gray-100 text-gray-500'
                        : 'bg-gray-50 hover:bg-purple-100 border border-gray-200'
                    }`}
                    >
                    {option}
                    </motion.button>
                ))}
                </div>

                {gameState.answered && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
                    <button
                    onClick={startTamamlamaGame}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors shadow-md"
                    >
                    Yeni Soru
                    </button>
                </motion.div>
                )}
            </div>
            ) : (
            // Oyun Modu (Anlam Bulma)
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
                <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                    Anlamını Bul Oyunu
                </h3>
                <ul className="space-y-1 text-amber-700 text-sm">
                    <li>• Verilen deyimin doğru anlamını şıklardan seçin.</li>
                    <li>• Toplam {QUESTIONS_PER_GAME} soru sorulacaktır.</li>
                    {/* XP Kazanma bilgisi kaldırıldı */}
                    {/* <li>• Her doğru cevap için 10 XP kazanırsınız.</li> */}
                    <li className="font-medium pt-1 border-t border-amber-200 mt-1">• Mevcut Skor: {gameState.score} / {QUESTIONS_PER_GAME}</li>
                </ul>
                </div>
                <div className="text-center mb-8 min-h-[150px] flex flex-col justify-center">
                    <motion.div
                        key={gameState.currentDeyim?.id} // Deyim değiştiğinde animasyonu tetikle
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 inline-block mb-4"
                    >
                        <h2 className="text-2xl font-bold text-amber-800">
                        {gameState.currentDeyim?.deyim}
                        </h2>
                    </motion.div>
                    <p className="text-gray-600 text-sm">Bu deyimin anlamı nedir?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.options.map((option, index) => (
                    <motion.button
                    key={option + index} // Option metni + index daha güvenli key
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option)}
                    disabled={gameState.answered}
                    className={`p-4 rounded-xl text-left transition-all text-sm md:text-base ${
                        gameState.answered
                        ? option === gameState.currentDeyim?.aciklama
                            ? 'bg-green-100 border-2 border-green-500 text-green-800 font-semibold'
                            : option === gameState.selectedAnswer
                            ? 'bg-red-100 border-2 border-red-500 text-red-800'
                            : 'bg-gray-100 text-gray-500'
                        : 'bg-gray-50 hover:bg-amber-100 border border-gray-200'
                    }`}
                    >
                    {option}
                    </motion.button>
                ))}
                </div>
                 {/* Oyun bittiğinde veya cevaplandığında gösterilecek alan */}
                 {gameState.answered && mode === 'oyun' && (
                    <div className="mt-6 text-center">
                        {gameState.score >= QUESTIONS_PER_GAME && (
                             <p className="text-green-600 font-semibold">Oyun Bitti!</p>
                        )}
                    </div>
                )}
            </div>
            )}
        </main>

      </div>
    </div>
  );
};

export default DeyimlerPage;
// XPWarning bileşeni (değişiklik yok)
interface XPWarningProps {
  requiredXP: number;
  currentXP: number;
  title: string;
  // errorMessage prop'u kaldırıldı
}

const XPWarning = ({ requiredXP, currentXP, title }: XPWarningProps) => {
  const progress = Math.min((currentXP / requiredXP) * 100, 100);
  const hasEnoughXP = currentXP >= requiredXP;

  if (hasEnoughXP) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">
              Bu özelliği kullanmak için en az {requiredXP} XP'ye ihtiyacınız var.
              Şu anda {currentXP} XP'niz var.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-1">
          <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{currentXP} / {requiredXP} XP</span>
        </div>
      </div>
    </div>
    </div>
  );
};