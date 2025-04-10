import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '../lib/supabase';
 import { useSound } from '../hooks/useSound';
 import { motion, AnimatePresence } from 'framer-motion'; // AnimatePresence ekledik
 import { useAuth } from '../contexts/AuthContext';
 import { toast } from 'react-hot-toast';
 import { Brain, CheckCircle, XCircle } from 'lucide-react'; // İkonları ekledik
 import { useXPCheck } from '../hooks/useXPCheck';
 import XPWarning from '../components/XPWarning';

 // Constants
 const MEMORIZE_DURATION = 3000; // Hedefi ezberleme süresi (ms)
 const FEEDBACK_DURATION = 2000; // Doğru/yanlış geri bildirim süresi (ms)
 const NUM_SAME_FOLDER_OPTIONS = 3; // Hedefle aynı klasörden kaç seçenek alınacağı
 const NUM_NEARBY_FOLDER_OPTIONS = 2; // Hedefe yakın klasörlerden kaç seçenek alınacağı
 const MAX_NEARBY_FOLDER_DISTANCE = 3; // Yakın klasörler için maksimum uzaklık

 // Interfaces
 interface ImageCard {
   id: string; // Klasör ID'si
   src: string; // Resim yolu
   name: string; // Resim adı (örn. "Soru 123")
   option: string; // Seçenek harfi (A, B, C, D, E)
   isTarget: boolean; // Bu resim hedefin kendisi mi?
   isAnswer: boolean; // Bu resim cevap resmi mi? (klasördeki cevap)
   position?: number; // Render sırasında karıştırma için rastgele pozisyon
 }

 interface GameSession {
     userId: string | undefined;
     score: number;
     questionsAnswered: number;
     streak: number;
     startTime: Date | null;
 }

 // Animation Variants
 const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
         opacity: 1,
         transition: { duration: 0.5 }
     },
     exit: { opacity: 0, transition: { duration: 0.3 } }
 };

 const itemVariants = {
     hidden: { opacity: 0, scale: 0.95 },
     visible: {
         opacity: 1,
         scale: 1,
         transition: { duration: 0.3, delay: 0 } // ÖNEMLİ: delay: 0 -> aynı anda başlar
     }
 };


 const MemoryGamePage = () => {
     // --- Hooks ---
     const { user } = useAuth();
     const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);
     const { playSound } = useSound();

     // --- State ---
     // Loading States
     const [isLoading, setIsLoading] = useState(true); // Sayfanın genel yüklenmesi (XP kontrolü dahil)
     const [isQuestionLoading, setIsQuestionLoading] = useState(false); // Yeni soru yüklenirken aktifleşir

     // Game Flow States
     const [showOptions, setShowOptions] = useState(false); // Seçeneklerin gösterilip gösterilmeyeceği
     const [isAnswered, setIsAnswered] = useState(false); // Soru cevaplandı mı?
     const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // Cevap doğru mu?

     // Game Data States
     const [targetImage, setTargetImage] = useState<ImageCard | null>(null); // Ezberlenecek hedef resim
     const [options, setOptions] = useState<ImageCard[]>([]); // Seçenek resimler (hedef hariç)
     const [selectedSrc, setSelectedSrc] = useState<string | null>(null); // Kullanıcının tıkladığı resmin src'si

     // Game Session State
     const [session, setSession] = useState<GameSession>({
         userId: user?.id,
         score: 0,
         questionsAnswered: 0,
         streak: 0,
         startTime: null,
     });

     // --- Data Fetching and Processing ---

     // Resim verilerini dosya sisteminden alır ve klasörlere göre gruplar
     const getImageData = useCallback((): { [key: string]: ImageCard[] } => {
         // Vite'nin glob import özelliği kullanılıyor
         const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });
         const imagesByFolder: { [key: string]: ImageCard[] } = {};

         Object.keys(optionImports).forEach(path => {
             // Dosya adından klasör ID'sini, seçenek harfini ve cevap olup olmadığını çıkarır
             const answerMatch = path.match(/Matris\/(\d+)\/Soru-cevap-\d+([A-E])\.webp/);
             const optionMatch = path.match(/Matris\/(\d+)\/Soru-\d+([A-E])\.webp/);
             const match = answerMatch || optionMatch;

             if (!match) return; // Eşleşme yoksa atla

             const [_, folderId, option] = match;
             const image: ImageCard = {
                 id: folderId,
                 src: path.replace('/public', ''), // Public kısmını kaldırarak URL'yi düzelt
                 name: `Soru ${folderId}`,
                 option,
                 isTarget: false, // Başlangıçta hedef değil
                 isAnswer: !!answerMatch, // answerMatch varsa true, yoksa false
             };

             // Klasöre göre gruplama
             if (!imagesByFolder[folderId]) {
                 imagesByFolder[folderId] = [];
             }
             imagesByFolder[folderId].push(image);
         });
         return imagesByFolder;
     }, []);

     // Verilen resim verilerinden hedef ve seçenekleri seçer
     const selectQuestionElements = useCallback((imagesByFolder: { [key: string]: ImageCard[] }) => {
         const folderIds = Object.keys(imagesByFolder).sort((a, b) => parseInt(a) - parseInt(b));
         if (folderIds.length === 0) {
             toast.error('Yeterli sayıda soru klasörü bulunamadı.');
             throw new Error('No image folders found');
         }

         // 1. Hedefi Seç
         const targetFolderIndex = Math.floor(Math.random() * folderIds.length);
         const targetFolderId = folderIds[targetFolderIndex];
         const targetFolderImages = imagesByFolder[targetFolderId];
         const answerImage = targetFolderImages?.find(img => img.isAnswer); // Klasördeki cevap resmini bul

         if (!answerImage) {
             console.error('Cevap resmi bulunamadı:', targetFolderId);
             // Hata durumunda başka bir klasör dene veya hata fırlat (şimdilik fırlatıyoruz)
             throw new Error(`'${targetFolderId}' klasöründe cevap resmi bulunamadı.`);
         }
         // Hedef resmi belirle ve karıştırma için rastgele pozisyon ata
         const finalTarget = { ...answerImage, isTarget: true, position: Math.random() };

         // 2. Aynı Klasörden Seçenekleri Seç
         const sameFolderOptions = targetFolderImages
             .filter(img => !img.isAnswer) // Cevap olmayanları al
             .sort(() => Math.random() - 0.5) // Rastgele sırala
             .slice(0, NUM_SAME_FOLDER_OPTIONS); // İstenen sayıda al

         // 3. Yakın Klasörlerden Seçenekleri Seç
         const nearbyFolderIds = folderIds.filter(id => {
             const diff = Math.abs(parseInt(id) - parseInt(targetFolderId));
             // Kendisi olmayan ve belirli mesafedeki klasörleri al
             return diff > 0 && diff <= MAX_NEARBY_FOLDER_DISTANCE;
         }).sort(() => Math.random() - 0.5); // Yakın klasörleri de karıştır

         const nearbyOptions: ImageCard[] = [];
         for (const folderId of nearbyFolderIds) {
              if (nearbyOptions.length >= NUM_NEARBY_FOLDER_OPTIONS) break; // İstenen sayıya ulaşıldıysa dur
              const folderImages = imagesByFolder[folderId]?.filter(img => !img.isAnswer); // O klasördeki cevap olmayanları al
              if (folderImages && folderImages.length > 0) {
                  // Klasörden rastgele bir seçenek al ve ekle
                  nearbyOptions.push(folderImages[Math.floor(Math.random() * folderImages.length)]);
              }
         }

         // Eğer hala yeterli sayıda seçenek yoksa, rastgele başka klasörlerden de eklenebilir (opsiyonel)

         // Tüm seçenekleri birleştir ve her birine rastgele pozisyon ata
         const finalOptions = [...sameFolderOptions, ...nearbyOptions]
              .map(opt => ({ ...opt, isTarget: false, position: Math.random() })); // Hedef olmadıklarını ve pozisyonlarını belirle

         return { finalTarget, finalOptions };

     }, []); // Bu fonksiyonların bağımlılığı yok


     // --- Game Logic ---

     // Yeni bir soru yükler (hedef ve seçenekleri ayarlar)
     const loadNewQuestion = useCallback(async () => {
         setIsQuestionLoading(true); // Soru yükleniyor...
         setShowOptions(false); // Seçenekleri gizle
         setSelectedSrc(null); // Önceki seçimi temizle
         setIsAnswered(false); // Cevaplanmadı olarak işaretle
         setIsCorrect(null); // Doğruluk durumunu sıfırla
         setTargetImage(null); // Önceki hedefi temizle
         setOptions([]);       // Önceki seçenekleri temizle

         try {
             // Resim verilerini al ve işle
             const imagesByFolder = getImageData();
             // Hedef ve seçenekleri seç
             const { finalTarget, finalOptions } = selectQuestionElements(imagesByFolder);

             // State'i güncelle
             setTargetImage(finalTarget);
             setOptions(finalOptions);

             setIsLoading(false); // Genel yüklenme bitti (ilk soru yüklendiğinde)
             setIsQuestionLoading(false); // Soru yükleme bitti

             // Hedefi gösterme süresini başlat
             const timer = setTimeout(() => {
                 setShowOptions(true); // Süre dolunca seçenekleri göster
             }, MEMORIZE_DURATION);

             // Component unmount olursa veya tekrar yüklenirse timer'ı temizle
             return () => clearTimeout(timer);

         } catch (error: any) {
             console.error('Soru yüklenirken hata oluştu:', error);
             toast.error(`Soru yüklenemedi: ${error.message || 'Bilinmeyen bir hata.'}`);
             setIsLoading(false); // Yüklenmeyi durdur
             setIsQuestionLoading(false);
             // Burada kullanıcıya hata mesajı göstermek için ek bir state kullanılabilir
         }
     }, [getImageData, selectQuestionElements]); // useCallback bağımlılıkları

     // Kullanıcı bir seçeneğe tıkladığında çalışır
     const handleOptionClick = useCallback(async (selectedImage: ImageCard) => {
         // Eğer zaten cevaplanmışsa, hedef yoksa veya yeni soru yükleniyorsa işlem yapma
         if (isAnswered || !targetImage || isQuestionLoading) return;

         setSelectedSrc(selectedImage.src); // Seçilen resmin kaynağını kaydet
         setIsAnswered(true); // Cevaplandı olarak işaretle
         const correct = selectedImage.src === targetImage.src; // Seçilen hedefle aynı mı?
         setIsCorrect(correct); // Doğruluk durumunu ayarla

         // Oyun oturum state'ini güncelle
         setSession(prev => ({
             ...prev,
             score: prev.score + (correct ? 1 : 0), // Doğruysa skoru artır
             streak: correct ? prev.streak + 1 : 0, // Doğruysa seriyi artır, yanlışsa sıfırla
             questionsAnswered: prev.questionsAnswered + 1, // Cevaplanan soru sayısını artır
         }));

         // Ses efekti çal
         playSound(correct ? 'correct' : 'incorrect');

         // Geri bildirim süresinden sonra yeni soruyu yükle
         const timer = setTimeout(() => {
             loadNewQuestion();
         }, FEEDBACK_DURATION);

         // Component unmount olursa veya tekrar yüklenirse timer'ı temizle
         return () => clearTimeout(timer);

     }, [isAnswered, targetImage, isQuestionLoading, playSound, loadNewQuestion]); // useCallback bağımlılıkları

     // --- Lifecycle ---

     // Component ilk yüklendiğinde ve kullanıcı değiştiğinde çalışır
     useEffect(() => {
         setIsLoading(true); // Başlangıçta yükleniyor
         loadNewQuestion(); // İlk soruyu yükle
         setSession(prev => ({ ...prev, startTime: new Date(), userId: user?.id })); // Oturumu başlat/güncelle

         // Component kaldırıldığında (unmount) oturum sonucunu kaydet
         return () => {
              console.log("Hafıza Oyunu: Component kaldırılıyor, oturum kaydediliyor...");
              saveGameSession();
         };
         // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [loadNewQuestion, user?.id]); // Bağımlılıklar: Sadece ilk yükleme ve kullanıcı değişimi

     // --- Database Interaction ---

     // Oyun oturumunun sonucunu Supabase'e kaydeder
     const saveGameSession = async () => {
         // Kullanıcı yoksa veya hiç soru cevaplanmadıysa kaydetme
         if (!session.userId || session.questionsAnswered === 0) {
             console.log("Hafıza Oyunu: Kaydedilecek oturum verisi yok veya kullanıcı yok.");
             return;
         }

         console.log("Hafıza Oyunu: Oturum sonucu kaydediliyor:", session);

         const { error } = await supabase
             .from('quiz_results') // Supabase tablo adınız
             .insert({
                 user_id: session.userId,
                 score: session.score,
                 questions_answered: session.questionsAnswered,
                 correct_answers: session.score, // Skor = doğru cevap sayısı varsayımı
                 completed_at: new Date().toISOString(), // Bitiş zamanı
                 // started_at: session.startTime?.toISOString(), // Başlangıç zamanı (isteğe bağlı)
                 title: 'Hafıza Oyunu', // Oyunun adı
                 subject: 'Matris',    // Konu
                 grade: 0 // Seviye (varsa)
             });

         if (error) {
             console.error('Hafıza Oyunu: Oturum sonucu kaydedilirken hata:', error);
             toast.error("Oyun sonucu kaydedilemedi.");
         } else {
             console.log("Hafıza Oyunu: Oturum sonucu başarıyla kaydedildi.");
             // Oturum kaydedildikten sonra state'i sıfırlamak isterseniz burada yapabilirsiniz
         }
     };

     // --- Rendering ---

     // Render edilecek içeriği belirleyen fonksiyon
     const renderContent = () => {
         // 1. Yükleniyor Ekranı (XP veya ilk soru)
         if (xpLoading || isLoading) {
             return (
                 <div className="min-h-screen flex items-center justify-center bg-gray-50">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                     <p className="ml-4 text-gray-600">Yükleniyor...</p>
                 </div>
             );
         }

         // 2. Yetersiz XP Ekranı
         if (!hasEnoughXP) {
             return (
                 <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                     <XPWarning
                         requiredXP={requiredXP}
                         currentXP={userXP}
                         title="Hafıza Oyunu sayfasına erişim için yeterli XP'niz yok"
                     />
                 </div>
             );
         }

         // 3. Oyun Ekranı
         // Seçenekleri render etmek için hedefi ve diğer seçenekleri birleştirip pozisyona göre sırala
         const displayImages = targetImage ? [targetImage, ...options] : [...options];
         // Pozisyonu olmayanları sona atmak için ?? 0 kullandık
         displayImages.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));


         return (
             <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
                 <div className="container mx-auto max-w-4xl">
                     {/* Header: Başlık ve Skor Tablosu */}
                     <motion.div
                         initial={{ opacity: 0, y: -20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.5 }}
                         className="bg-white rounded-2xl shadow-xl p-6 mb-8"
                     >
                         <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                             {/* Başlık */}
                             <div className="flex items-center gap-3">
                                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl shadow-lg">
                                     <Brain className="w-7 h-7 text-white" />
                                 </div>
                                 <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                     Bilsem Sınavı Hafıza
                                 </h1>
                             </div>
                             {/* Skor Tablosu */}
                             <div className="flex gap-3 sm:gap-4">
                                 <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-3 min-w-[80px] sm:min-w-[100px] text-center">
                                     <p className="text-xs sm:text-sm text-emerald-600 font-medium">Skor</p>
                                     <p className="text-xl sm:text-2xl font-bold text-emerald-700">{session.score}</p>
                                 </div>
                                 <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-3 min-w-[80px] sm:min-w-[100px] text-center">
                                     <p className="text-xs sm:text-sm text-blue-600 font-medium">Seri</p>
                                     <p className="text-xl sm:text-2xl font-bold text-blue-700">{session.streak}</p>
                                 </div>
                                 <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-3 min-w-[80px] sm:min-w-[100px] text-center">
                                     <p className="text-xs sm:text-sm text-purple-600 font-medium">Toplam</p>
                                     <p className="text-xl sm:text-2xl font-bold text-purple-700">{session.questionsAnswered}</p>
                                 </div>
                             </div>
                         </div>
                     </motion.div>

                     {/* Ana Oyun Alanı */}
                     <div className="relative min-h-[400px]"> {/* Animasyon geçişleri için alan */}
                         <AnimatePresence mode="wait"> {/* Bir eleman çıkarken diğeri beklemesi için */}

                             {/* Durum 1: Hedef Gösteriliyor */}
                             {targetImage && !showOptions && !isQuestionLoading && (
                                 <motion.div
                                     key="target-display"
                                     variants={containerVariants}
                                     initial="hidden"
                                     animate="visible"
                                     exit="exit"
                                     className="bg-white rounded-2xl shadow-xl p-6 mb-8"
                                 >
                                     <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center text-gray-800">Bu resmi hatırla:</h2>
                                     <motion.div
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.4 }}
                                        className="flex justify-center"
                                     >
                                         <img
                                             src={targetImage.src}
                                             alt={`Hedef Resim: ${targetImage.name} - Seçenek ${targetImage.option}`}
                                             className="relative rounded-lg sm:rounded-xl shadow-lg max-w-full h-auto max-h-64 object-contain"
                                         />
                                     </motion.div>
                                 </motion.div>
                             )}

                             {/* Durum 2: Yeni Soru Yükleniyor */}
                             {isQuestionLoading && (
                                 <motion.div
                                     key="question-loading"
                                     variants={containerVariants}
                                     initial="hidden"
                                     animate="visible"
                                     exit="exit"
                                     className="absolute inset-0 flex flex-col justify-center items-center"
                                 >
                                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                                      <p className="text-gray-600">Yeni soru hazırlanıyor...</p>
                                 </motion.div>
                             )}

                             {/* Durum 3: Seçenekler Gösteriliyor */}
                             {showOptions && !isQuestionLoading && (
                                 <motion.div
                                     key="options-display"
                                     variants={containerVariants}
                                     initial="hidden"
                                     animate="visible"
                                     exit="exit"
                                     className="bg-white rounded-2xl shadow-xl p-4 sm:p-6"
                                 >
                                     <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center text-gray-800">Hatırladığın resmi bul:</h2>
                                     {/* Seçenekler Grid'i */}
                                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto">
                                         {displayImages.map((image, index) => (
                                             <motion.div
                                                 key={`<span class="math-inline">\{image\.id\}\-</span>{image.option}-${index}`} // Benzersiz key
                                                 variants={itemVariants} // Yukarıda tanımlanan item animasyonu
                                                 // initial, animate, exit prop'ları kapsayıcıdan miras alınır ama override edilebilir
                                                 // Burada container'ın `visible`'ı tetiklediği için item'lar da `visible` olur
                                                 className={`relative aspect-square cursor-pointer group ${isAnswered ? 'pointer-events-none' : ''}`}
                                                 onClick={() => !isAnswered && handleOptionClick(image)} // Sadece cevaplanmadıysa tıkla
                                             >
                                                 <div
                                                     className={`relative rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 shadow-md h-full w-full
                                                     ${isAnswered && selectedSrc === image.src // Seçilen resim mi?
                                                         ? image.src === targetImage?.src // Seçilen doğru mu?
                                                             ? 'ring-4 ring-emerald-400 shadow-emerald-300/50' // Seçilen Doğru
                                                             : 'ring-4 ring-red-400 shadow-red-300/50'       // Seçilen Yanlış
                                                         : isAnswered && image.src === targetImage?.src // Seçilmeyen ama doğru olan mı?
                                                             ? 'ring-4 ring-emerald-300 opacity-60'      // Doğru Cevap (Vurgu)
                                                             : 'hover:shadow-lg hover:scale-105'           // Normal / Hover
                                                     }`}
                                                 >
                                                     <img
                                                         src={image.src}
                                                         alt={`Seçenek ${index + 1}: ${image.name} - ${image.option}`}
                                                         className="w-full h-full object-contain bg-gray-50"
                                                         loading="lazy" // Lazy loading
                                                     />
                                                     {/* Doğru Cevap İşareti (Sadece doğru resmin üzerinde gösterilir) */}
                                                     {isAnswered && image.src === targetImage?.src && (
                                                         <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
                                                            className="absolute inset-0 flex items-center justify-center bg-emerald-500/60 backdrop-blur-sm"
                                                            >
                                                              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                                         </motion.div>
                                                     )}
                                                      {/* Yanlış Seçim İşareti (Sadece yanlış seçilenin üzerinde gösterilir) */}
                                                      {isAnswered && selectedSrc === image.src && image.src !== targetImage?.src && (
                                                         <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
                                                            className="absolute inset-0 flex items-center justify-center bg-red-500/60 backdrop-blur-sm"
                                                            >
                                                              <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                                         </motion.div>
                                                      )}
                                                 </div>
                                             </motion.div>
                                         ))}
                                     </div>
                                 </motion.div>
                             )}

                             {/* Durum 4: Sonuç Mesajı Gösteriliyor */}
                             {isAnswered && (
                                 <motion.div
                                     key="result-message"
                                     initial={{ opacity: 0, y: 20 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     transition={{ delay: 0.3 }} // Seçenek animasyonundan biraz sonra gelsin
                                     className={`absolute bottom-[-70px] left-0 right-0 mx-auto w-fit mt-6 p-4 rounded-lg text-center shadow-lg ${isCorrect ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`}
                                 >
                                     <p className="text-base sm:text-lg font-semibold text-white">
                                         {isCorrect ? 'Harika! Doğru bildin! 🎉' : 'Üzgünüm, yanlış seçim! 😢'}
                                     </p>
                                 </motion.div>
                             )}
                         </AnimatePresence>
                     </div>
                 </div>
             </div>
         );
     };

     // Ana render fonksiyonu çağrılır
     return renderContent();
 };

 export default MemoryGamePage;