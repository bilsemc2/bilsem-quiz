import { useState, useEffect, useCallback, useRef } from 'react'; // useRef eklendi
 import { supabase } from '../lib/supabase';
 import { useSound } from '../hooks/useSound';
 import { motion, AnimatePresence } from 'framer-motion';
 import { useAuth } from '../contexts/AuthContext';
 import { toast } from 'react-hot-toast';
 import { Brain, CheckCircle, XCircle } from 'lucide-react';
 import { useXPCheck } from '../hooks/useXPCheck';
 import XPWarning from '../components/XPWarning';

 // Constants
 const MEMORIZE_DURATION = 3000; // Hedefi ezberleme süresi (ms)
 const FEEDBACK_DURATION = 2000; // Doğru/yanlış geri bildirim süresi (ms)
 const OPTIONS_APPEAR_DELAY = 3000; // Seçeneklerin görünme gecikmesi (ms)
 const NUM_SAME_FOLDER_OPTIONS = 3;
 const NUM_NEARBY_FOLDER_OPTIONS = 2;
 const MAX_NEARBY_FOLDER_DISTANCE = 3;

 // Interfaces (Tam Tanım)
 interface ImageCard {
   id: string;
   src: string;
   name: string;
   option: string;
   isTarget: boolean;
   isAnswer: boolean;
   position?: number;
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
     visible: { opacity: 1, transition: { duration: 0.5 } },
     exit: { opacity: 0, transition: { duration: 0.3 } }
 };

 // Kart Dönme Efekti İçin
 const itemVariants = {
     hidden: {
         opacity: 0,
         rotateY: 90,
     },
     visible: {
         opacity: 1,
         rotateY: 0,
         transition: {
             duration: 0.4,
             delay: 0
         }
     },
      exit: {
          opacity: 0,
          rotateY: -90,
          transition: { duration: 0.3 }
      }
 };


 const MemoryGamePage = () => {
     // --- Hooks ---
     const { user } = useAuth();
     const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);
     const { playSound } = useSound();

     // --- Refs for Timers ---
     const memorizeTimerRef = useRef<NodeJS.Timeout | null>(null);
     const optionsDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

     // --- State ---
     const [isLoading, setIsLoading] = useState(true);
     const [isQuestionLoading, setIsQuestionLoading] = useState(false);
     const [showOptions, setShowOptions] = useState(false);
     const [isAnswered, setIsAnswered] = useState(false);
     const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
     const [targetImage, setTargetImage] = useState<ImageCard | null>(null);
     const [options, setOptions] = useState<ImageCard[]>([]);
     const [selectedSrc, setSelectedSrc] = useState<string | null>(null);
     const [session, setSession] = useState<GameSession>({ // Tam Tanım
         userId: user?.id,
         score: 0,
         questionsAnswered: 0,
         streak: 0,
         startTime: null,
     });

     // --- Data Fetching and Processing ---
     const getImageData = useCallback((): { [key: string]: ImageCard[] } => {
         const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });
         const imagesByFolder: { [key: string]: ImageCard[] } = {};
         Object.keys(optionImports).forEach(path => {
             const answerMatch = path.match(/Matris\/(\d+)\/Soru-cevap-\d+([A-E])\.webp/);
             const optionMatch = path.match(/Matris\/(\d+)\/Soru-\d+([A-E])\.webp/);
             const match = answerMatch || optionMatch;
             if (!match) return;
             const [_, folderId, option] = match;
             const image: ImageCard = {
                 id: folderId,
                 src: path.replace('/public', ''),
                 name: `Soru ${folderId}`,
                 option,
                 isTarget: false,
                 isAnswer: !!answerMatch,
             };
             if (!imagesByFolder[folderId]) {
                 imagesByFolder[folderId] = [];
             }
             imagesByFolder[folderId].push(image);
         });
         return imagesByFolder;
     }, []);

     const selectQuestionElements = useCallback((imagesByFolder: { [key: string]: ImageCard[] }) => {
         const folderIds = Object.keys(imagesByFolder).sort((a, b) => parseInt(a) - parseInt(b));
         if (folderIds.length === 0) {
             toast.error('Yeterli sayıda soru klasörü bulunamadı.');
             throw new Error('No image folders found');
         }
         const targetFolderIndex = Math.floor(Math.random() * folderIds.length);
         const targetFolderId = folderIds[targetFolderIndex];
         const targetFolderImages = imagesByFolder[targetFolderId];
         const answerImage = targetFolderImages?.find(img => img.isAnswer);
         if (!answerImage) {
             console.error('Cevap resmi bulunamadı:', targetFolderId);
             throw new Error(`'${targetFolderId}' klasöründe cevap resmi bulunamadı.`);
         }
         const finalTarget = { ...answerImage, isTarget: true, position: Math.random() };
         const sameFolderOptions = targetFolderImages
             .filter(img => !img.isAnswer)
             .sort(() => Math.random() - 0.5)
             .slice(0, NUM_SAME_FOLDER_OPTIONS);
         const nearbyFolderIds = folderIds.filter(id => {
             const diff = Math.abs(parseInt(id) - parseInt(targetFolderId));
             return diff > 0 && diff <= MAX_NEARBY_FOLDER_DISTANCE;
         }).sort(() => Math.random() - 0.5);
         const nearbyOptions: ImageCard[] = [];
         for (const folderId of nearbyFolderIds) {
              if (nearbyOptions.length >= NUM_NEARBY_FOLDER_OPTIONS) break;
              const folderImages = imagesByFolder[folderId]?.filter(img => !img.isAnswer);
              if (folderImages && folderImages.length > 0) {
                  nearbyOptions.push(folderImages[Math.floor(Math.random() * folderImages.length)]);
              }
         }
         const finalOptions = [...sameFolderOptions, ...nearbyOptions]
              .map(opt => ({ ...opt, isTarget: false, position: Math.random() }));
         return { finalTarget, finalOptions };
     }, []);

     // --- Game Logic ---
     const loadNewQuestion = useCallback(async () => {
        if (memorizeTimerRef.current) clearTimeout(memorizeTimerRef.current);
        if (optionsDelayTimerRef.current) clearTimeout(optionsDelayTimerRef.current);
        setIsQuestionLoading(true);
        setShowOptions(false);
        setSelectedSrc(null);
        setIsAnswered(false);
        setIsCorrect(null);
        setTargetImage(null);
        setOptions([]);
        try {
            const imagesByFolder = getImageData();
            const { finalTarget, finalOptions } = selectQuestionElements(imagesByFolder);
            setTargetImage(finalTarget);
            setOptions(finalOptions);
            setIsLoading(false);
            setIsQuestionLoading(false);
            memorizeTimerRef.current = setTimeout(() => {
                optionsDelayTimerRef.current = setTimeout(() => {
                    setShowOptions(true);
                }, OPTIONS_APPEAR_DELAY);
            }, MEMORIZE_DURATION);
        } catch (error: any) {
             console.error('Soru yüklenirken hata oluştu:', error);
             toast.error(`Soru yüklenemedi: ${error.message || 'Bilinmeyen bir hata.'}`);
             setIsLoading(false);
             setIsQuestionLoading(false);
        }
     }, [getImageData, selectQuestionElements]);

     const handleOptionClick = useCallback(async (selectedImage: ImageCard) => {
         if (isAnswered || !targetImage || isQuestionLoading) return;
         setSelectedSrc(selectedImage.src);
         setIsAnswered(true);
         const correct = selectedImage.src === targetImage.src;
         setIsCorrect(correct);
         setSession(prev => ({ // Tam State Güncellemesi
             ...prev,
             score: prev.score + (correct ? 1 : 0),
             streak: correct ? prev.streak + 1 : 0,
             questionsAnswered: prev.questionsAnswered + 1,
         }));
         playSound(correct ? 'correct' : 'incorrect');
         const timer = setTimeout(() => {
             loadNewQuestion();
         }, FEEDBACK_DURATION);
         // Bu timer için de ref kullanmak daha güvenli olabilir, ama şimdilik böyle bırakıyoruz.
         return () => clearTimeout(timer);
     }, [isAnswered, targetImage, isQuestionLoading, playSound, loadNewQuestion]);

     // --- Lifecycle ---
     useEffect(() => {
         setIsLoading(true);
         loadNewQuestion();
         setSession(prev => ({ ...prev, startTime: new Date(), userId: user?.id }));
         return () => {
              console.log("Hafıza Oyunu: Component kaldırılıyor, oturum kaydediliyor...");
              if (memorizeTimerRef.current) {
                  clearTimeout(memorizeTimerRef.current);
              }
              if (optionsDelayTimerRef.current) {
                  clearTimeout(optionsDelayTimerRef.current);
              }
              saveGameSession();
         };
         // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [loadNewQuestion, user?.id]);

     // --- Database Interaction ---
     const saveGameSession = async () => {
         if (!session.userId || session.questionsAnswered === 0) {
             console.log("Hafıza Oyunu: Kaydedilecek oturum verisi yok veya kullanıcı yok.");
             return;
         }
         console.log("Hafıza Oyunu: Oturum sonucu kaydediliyor:", session);
         const { error } = await supabase
             .from('quiz_results')
             .insert({
                 user_id: session.userId,
                 score: session.score,
                 questions_answered: session.questionsAnswered,
                 correct_answers: session.score,
                 completed_at: new Date().toISOString(),
                 title: 'Hafıza Oyunu',
                 subject: 'Matris',
                 grade: 0
             });
         if (error) {
             console.error('Hafıza Oyunu: Oturum sonucu kaydedilirken hata:', error);
             toast.error("Oyun sonucu kaydedilemedi.");
         } else {
             console.log("Hafıza Oyunu: Oturum sonucu başarıyla kaydedildi.");
         }
     };

     // --- Rendering ---
     const renderContent = () => {
         // 1. Yükleniyor Ekranı (Tam JSX)
         if (xpLoading || isLoading) {
             return (
                 <div className="min-h-screen flex items-center justify-center bg-gray-50">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                     <p className="ml-4 text-gray-600">Yükleniyor...</p>
                 </div>
             );
         }

         // 2. Yetersiz XP Ekranı (Tam JSX)
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
         const displayImages = targetImage ? [targetImage, ...options] : [...options];
         displayImages.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));

         return (
             <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
                 <div className="container mx-auto max-w-4xl">
                     {/* Header (Tam JSX) */}
                     <motion.div
                         initial={{ opacity: 0, y: -20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.5 }}
                         className="bg-white rounded-2xl shadow-xl p-6 mb-8"
                     >
                         <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                             <div className="flex items-center gap-3">
                                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl shadow-lg">
                                     <Brain className="w-7 h-7 text-white" />
                                 </div>
                                 <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                     Bilsem Sınavı Hafıza
                                 </h1>
                             </div>
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
                     <div className="relative min-h-[400px]">
                         <AnimatePresence mode="wait">

                             {/* Durum 1: Hedef Gösteriliyor (Tam JSX) */}
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

                             {/* Durum 2: Yeni Soru Yükleniyor (Tam JSX) */}
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

                             {/* Durum 3: Seçenekler Gösteriliyor (Tam JSX) */}
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
                                     <div
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto"
                                        style={{ perspective: '1000px' }}
                                     >
                                         {displayImages.map((image, index) => (
                                             <motion.div
                                                 key={`<span class="math-inline">\{image\.id\}\-</span>{image.option}-${index}`}
                                                 variants={itemVariants}
                                                 className={`relative aspect-square cursor-pointer group ${isAnswered ? 'pointer-events-none' : ''}`}
                                                 onClick={() => !isAnswered && handleOptionClick(image)}
                                             >
                                                 <div
                                                     className={`relative rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 shadow-md h-full w-full
                                                     ${isAnswered && selectedSrc === image.src
                                                         ? image.src === targetImage?.src
                                                             ? 'ring-4 ring-emerald-400 shadow-emerald-300/50'
                                                             : 'ring-4 ring-red-400 shadow-red-300/50'
                                                         : isAnswered && image.src === targetImage?.src
                                                             ? 'ring-4 ring-emerald-300 opacity-60'
                                                             : 'hover:shadow-lg hover:scale-105'
                                                     }`}
                                                 >
                                                     <img
                                                         src={image.src}
                                                         alt={`Seçenek ${index + 1}: ${image.name} - ${image.option}`}
                                                         className="w-full h-full object-contain bg-gray-50"
                                                         loading="lazy"
                                                     />
                                                     {/* Doğru Cevap İşareti */}
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
                                                      {/* Yanlış Seçim İşareti */}
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

                             {/* Durum 4: Sonuç Mesajı Gösteriliyor (Tam JSX) */}
                             {isAnswered && (
                                 <motion.div
                                     key="result-message"
                                     initial={{ opacity: 0, y: 20 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     transition={{ delay: 0.3 }}
                                     className={`absolute bottom-[-70px] left-0 right-0 mx-auto w-fit mt-6 p-4 rounded-lg text-center shadow-lg z-10 ${isCorrect ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`}
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

     return renderContent();
 };

 export default MemoryGamePage;