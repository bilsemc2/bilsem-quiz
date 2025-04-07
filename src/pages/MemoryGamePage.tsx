import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSound } from '../hooks/useSound';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Brain } from 'lucide-react';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';

// Constants
const MEMORIZE_DURATION = 3000; // ms
const FEEDBACK_DURATION = 2000; // ms
const NUM_SAME_FOLDER_OPTIONS = 3;
const NUM_NEARBY_FOLDER_OPTIONS = 2; // Total options = 1 target + NUM_SAME + NUM_NEARBY
const MAX_NEARBY_FOLDER_DISTANCE = 3;

interface ImageCard {
  id: string; // Folder ID
  src: string;
  name: string; // e.g., "Soru 123"
  option: string; // A, B, C, D, E
  isTarget: boolean;
  isAnswer: boolean;
  position?: number; // For shuffling in render
}

interface GameSession {
    userId: string | undefined;
    score: number;
    questionsAnswered: number;
    streak: number;
    startTime: Date | null;
}

const MemoryGamePage = () => {
    const { user } = useAuth();
    const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);
    const { playSound } = useSound();

    const [isLoading, setIsLoading] = useState(true); // Overall page/initial load
    const [isQuestionLoading, setIsQuestionLoading] = useState(false); // Loading next question
    const [showQuestion, setShowQuestion] = useState(false); // Controls showing options vs target
    const [targetImage, setTargetImage] = useState<ImageCard | null>(null);
    const [options, setOptions] = useState<ImageCard[]>([]);
    const [selectedSrc, setSelectedSrc] = useState<string | null>(null); // Store src for comparison
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // Session State for better DB interaction
    const [session, setSession] = useState<GameSession>({
        userId: user?.id,
        score: 0,
        questionsAnswered: 0,
        streak: 0,
        startTime: null,
    });

    // --- Helper Function: Get Image Data ---
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
                isAnswer: !!answerMatch
            };

            if (!imagesByFolder[folderId]) {
                imagesByFolder[folderId] = [];
            }
            imagesByFolder[folderId].push(image);
        });
        return imagesByFolder;
    }, []);

    // --- Helper Function: Select Target and Options ---
    const selectQuestionElements = useCallback((imagesByFolder: { [key: string]: ImageCard[] }) => {
        const folderIds = Object.keys(imagesByFolder).sort((a, b) => parseInt(a) - parseInt(b));
        if (folderIds.length === 0) {
            toast.error('Yeterli sayıda soru bulunamadı.');
            throw new Error('No image folders found');
        }

        // Select Target
        const targetFolderIndex = Math.floor(Math.random() * folderIds.length);
        const targetFolderId = folderIds[targetFolderIndex];
        const targetFolderImages = imagesByFolder[targetFolderId];
        const answerImage = targetFolderImages.find(img => img.isAnswer);

        if (!answerImage) {
            console.error('Bu klasörde cevap resmi yok:', targetFolderId);
            // Fallback: try another folder or throw error
            throw new Error(`Answer image not found in folder ${targetFolderId}`);
        }
        const finalTarget = { ...answerImage, isTarget: true, position: Math.random() };

        // Select Same Folder Options
        const sameFolderOptions = targetFolderImages
            .filter(img => !img.isAnswer)
            .sort(() => Math.random() - 0.5)
            .slice(0, NUM_SAME_FOLDER_OPTIONS);

        // Select Nearby Folder Options
        const nearbyFolderIds = folderIds.filter(id => {
            const diff = Math.abs(parseInt(id) - parseInt(targetFolderId));
            return diff > 0 && diff <= MAX_NEARBY_FOLDER_DISTANCE;
        }).sort(() => Math.random() - 0.5); // Shuffle nearby folders

        const nearbyOptions: ImageCard[] = [];
        for (const folderId of nearbyFolderIds) {
             if (nearbyOptions.length >= NUM_NEARBY_FOLDER_OPTIONS) break;
             const folderImages = imagesByFolder[folderId]?.filter(img => !img.isAnswer); // Get non-answers
             if (folderImages && folderImages.length > 0) {
                 nearbyOptions.push(folderImages[Math.floor(Math.random() * folderImages.length)]);
             }
        }

         // Ensure total options (excluding target) reach the desired number if needed
        // (Could add logic here to pick from random folders if nearby/same aren't enough)

        const finalOptions = [...sameFolderOptions, ...nearbyOptions]
             .map(opt => ({ ...opt, position: Math.random() })); // Assign random position for shuffling

        return { finalTarget, finalOptions };

    }, []);


    // --- Load New Question Logic ---
    const loadNewQuestion = useCallback(async () => {
        setIsQuestionLoading(true);
        setShowQuestion(false);
        setSelectedSrc(null);
        setIsAnswered(false);
        setIsCorrect(null);
        setTargetImage(null); // Clear previous target while loading
        setOptions([]);

        try {
            const imagesByFolder = getImageData();
            const { finalTarget, finalOptions } = selectQuestionElements(imagesByFolder);

            setTargetImage(finalTarget);
            setOptions(finalOptions);

            setIsQuestionLoading(false);
            setIsLoading(false); // Also set main loading to false after first load

            // Start timer to hide target and show options
            const timer = setTimeout(() => {
                setShowQuestion(true);
            }, MEMORIZE_DURATION);

            return () => clearTimeout(timer); // Cleanup timer on unmount or reload

        } catch (error: any) {
            console.error('Soru yüklenirken hata:', error);
            toast.error(`Soru yüklenemedi: ${error.message || 'Bilinmeyen bir hata oluştu.'}`);
            setIsQuestionLoading(false);
            setIsLoading(false);
            // Handle error state appropriately, maybe show an error message component
        }
    }, [getImageData, selectQuestionElements]); // Add dependencies

    // --- Handle Option Click Logic ---
    const handleOptionClick = useCallback(async (selectedImage: ImageCard) => {
        if (isAnswered || !targetImage || isQuestionLoading) return;

        setSelectedSrc(selectedImage.src);
        setIsAnswered(true);
        const correct = selectedImage.src === targetImage.src;
        setIsCorrect(correct);

        // Update Session State
        setSession(prev => ({
            ...prev,
            score: prev.score + (correct ? 1 : 0),
            streak: correct ? prev.streak + 1 : 0,
            questionsAnswered: prev.questionsAnswered + 1,
        }));

        if (correct) {
            playSound('correct');
        } else {
            playSound('incorrect');
        }

        // Save progress less frequently or at the end (example: every 5 questions)
        // Or use useEffect to save on session change with debounce
        // Or save on component unmount / game end

        // Schedule next question
        const timer = setTimeout(() => {
            loadNewQuestion();
        }, FEEDBACK_DURATION);

        return () => clearTimeout(timer); // Cleanup timer

    }, [isAnswered, targetImage, isQuestionLoading, playSound, loadNewQuestion]); // Add dependencies


    // --- Initial Load & Start Session ---
    useEffect(() => {
        loadNewQuestion();
        setSession(prev => ({ ...prev, startTime: new Date(), userId: user?.id }));

        // Add cleanup logic for saving results when the component unmounts (example)
        return () => {
             console.log("Component unmounting, potentially save final results here");
             saveGameSession(); // Call save function on unmount
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadNewQuestion, user?.id]); // Load question once on mount, update userId if it changes

    // --- Function to Save Session Result ---
    const saveGameSession = async () => {
        if (!session.userId || session.questionsAnswered === 0) return; // Don't save if no user or no questions answered

        console.log("Saving game session:", session);

        const { error } = await supabase
            .from('quiz_results') // Use your actual table name
            .insert({
                user_id: session.userId,
                score: session.score,
                questions_answered: session.questionsAnswered,
                correct_answers: session.score, // Assuming score directly maps to correct answers
                completed_at: new Date().toISOString(), // Record end time
                // started_at: session.startTime?.toISOString(), // Optional: Record start time
                title: 'Hafıza Oyunu',
                subject: 'Matris',
                grade: 0 // Or derive from difficulty/user level if applicable
            });

        if (error) {
            console.error('Oturum sonucu kaydedilirken hata:', error);
            toast.error("Oyun sonucu kaydedilemedi.");
        } else {
            console.log("Oturum sonucu başarıyla kaydedildi.");
            // Optionally reset session state here if needed
        }
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (xpLoading || (isLoading && !targetImage)) { // Show loading on initial XP check or first question load
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            );
        }

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

        // Combine target and options for rendering, sort by pre-calculated position
        const displayImages = targetImage ? [targetImage, ...options] : [...options];
        displayImages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));


        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Hafıza Oyunu
                                </h1>
                            </div>
                            <div className="flex gap-4">
                                {/* Use session state for display */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-4 min-w-[100px] text-center">
                                    <p className="text-sm text-emerald-600 font-medium">Skor</p>
                                    <p className="text-2xl font-bold text-emerald-700">{session.score}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 min-w-[100px] text-center">
                                    <p className="text-sm text-blue-600 font-medium">Seri</p>
                                    <p className="text-2xl font-bold text-blue-700">{session.streak}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-4 min-w-[100px] text-center">
                                    <p className="text-sm text-purple-600 font-medium">Toplam</p>
                                    <p className="text-2xl font-bold text-purple-700">{session.questionsAnswered}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Target Image Display */}
                    {targetImage && !showQuestion && !isQuestionLoading && (
                         <motion.div /* ... existing animation ... */ className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                             <h2 className="text-xl font-semibold mb-6 text-gray-800">Bu resmi hatırla:</h2>
                             <motion.div /* ... existing animation ... */ className="flex justify-center">
                                 {/* ... existing image rendering ... */}
                                  <img
                                      src={targetImage.src}
                                      alt={`Hedef: ${targetImage.name} - ${targetImage.option}`} // More descriptive alt text
                                      className="relative rounded-2xl shadow-2xl w-full max-w-xs"
                                  />
                             </motion.div>
                         </motion.div>
                    )}

                     {/* Question Loading Indicator */}
                     {isQuestionLoading && (
                        <div className="flex justify-center items-center h-64">
                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                        </div>
                     )}


                    {/* Options Display */}
                    {showQuestion && !isQuestionLoading && (
                        <motion.div /* ... existing animation ... */ className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-semibold mb-6 text-gray-800">Hatırladığın resmi bul:</h2>
                             {/* Use the combined and sorted displayImages array */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto">
                                {displayImages.map((image, index) => (
                                    <motion.div
                                        key={`${image.id}-${image.option}-${index}`} // Ensure unique key
                                        // ... existing animation & layout ...
                                        className={`relative cursor-pointer group w-32 h-32 mx-auto ${isAnswered ? 'pointer-events-none' : ''}`} // Disable clicks after answer
                                        onClick={() => handleOptionClick(image)}
                                    >
                                       {/* ... Inner divs and img tag ... */}
                                       <div
                                            className={`relative rounded-xl overflow-hidden transition-all duration-300 shadow-lg h-full
                                            ${isAnswered && selectedSrc === image.src // Check selected source
                                                ? image.src === targetImage?.src // Is it the correct one?
                                                    ? 'ring-4 ring-emerald-500 shadow-emerald-200' // Correct selected
                                                    : 'ring-4 ring-red-500 shadow-red-200' // Incorrect selected
                                                : isAnswered && image.src === targetImage?.src // If answered and this IS the target (but wasn't selected)
                                                    ? 'ring-4 ring-emerald-300 opacity-70' // Highlight correct answer gently if wrong one was picked
                                                    : 'hover:shadow-xl' // Default hover
                                            }`}
                                       >
                                            <img
                                                src={image.src}
                                                alt={`Seçenek ${index + 1}: ${image.name} - ${image.option}`} // More descriptive alt
                                                className="w-full h-full object-contain"
                                            />
                                             {/* Checkmark only on the CORRECT image when answered */}
                                             {isAnswered && image.src === targetImage?.src && (
                                                 <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 bg-opacity-20 backdrop-blur-sm">
                                                      <motion.div /* ... animation ... */>
                                                         {/* ... svg checkmark ... */}
                                                      </motion.div>
                                                 </div>
                                             )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Result Message */}
                    {isAnswered && (
                         <motion.div /* ... existing animation ... */
                             className={`mt-8 p-6 rounded-2xl text-center ${isCorrect ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`}
                         >
                             <motion.p /* ... existing animation ... */ className="text-xl font-bold text-white">
                                 {isCorrect ? 'Harika! Doğru resmi buldun! 🎉' : 'Üzgünüm, yanlış resmi seçtin! 😢'}
                             </motion.p>
                             {/* Optional: Add a "Next Question" button here */}
                             {/* <button onClick={loadNewQuestion} className="mt-4 px-4 py-2 bg-white text-indigo-600 rounded shadow">Sonraki Soru</button> */}
                         </motion.div>
                    )}
                </div>
            </div>
        );
    };

    return renderContent();
};

export default MemoryGamePage;