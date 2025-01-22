export interface Quiz {
    id: string;
    title: string;
    description: string;
    grade: number;
    subject: string;
    questions: Question[];
}

export interface Question {
    id: string;
    questionImageUrl: string;
    question: string;
    options: Option[];
    correctOptionId: string;
    grade: number;
    subject: string;
    solutionVideo?: {
        url: string;
        title: string;
    };
}

export interface Option {
    id: string;
    imageUrl: string;
    text: string;
}

import { shuffleArray } from './arrayUtils';

function getQuestionNumber(filename: string): number {
    // Önce "Soru-cevap-" kalıbını kontrol et
    let match = filename.match(/Soru-cevap-(\d+)/);
    if (match) return parseInt(match[1]);
    
    // Sonra normal "Soru-" kalıbını kontrol et
    match = filename.match(/Soru-(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

function getOptionLetter(filename: string): string {
    // Önce "Soru-cevap-XXX" formatını kontrol et
    let match = filename.match(/Soru-cevap-\d+([A-E])/);
    if (match) return match[1];
    
    // Sonra "Soru-XXX" formatını kontrol et
    match = filename.match(/Soru-\d+([A-E])/);
    return match ? match[1] : '';
}

function isCorrectAnswer(filename: string): boolean {
    const isCorrect = filename.toLowerCase().includes('-cevap-')
                    
    
    return isCorrect;
}

function findCorrectOptionLetter(optionFiles: string[]): string {
    const correctOption = optionFiles.find(filename => isCorrectAnswer(filename));
    if (!correctOption) {
        return 'A';
    }
    const letter = getOptionLetter(correctOption);
    if (!letter) {
        return 'A';
    }
    return letter;
}

function extractFilename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
}

function getQuestionOptionsPath(questionNumber: number, category: string): string {
    return `/images/options/${category}/${questionNumber}`;
}

function getOptionImageUrl(questionNumber: number, category: string, optionFile: string): string {
    return `/images/options/${category}/Soru-cevap-${questionNumber}${getOptionLetter(optionFile)}.webp`;
}

// Soru-video eşleştirmeleri
const questionVideoMap: Record<string, { videoId: string; title: string }> = {
    '1': {
        videoId: 'EoHWHQVlpDE',
        title: 'Matris - Soru 1 Video Çözümü'
    },
    '2': {
        videoId: '-Tx9N-R_fW0',
        title: 'Matris - Soru 2 Video Çözümü'
    },
    // Diğer sorular için video ID'leri buraya eklenecek
};

export async function generateQuiz(questionCount: number = 10): Promise<Quiz> {
    const category = 'Matris';

    try {
        // Import all images from the public directory with category
        const questionImports = import.meta.glob('/public/images/questions/Matris/*.webp', { eager: true });
        const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });

        if (Object.keys(questionImports).length === 0) {
            throw new Error('Soru resimleri bulunamadı');
        }

        if (Object.keys(optionImports).length === 0) {
            throw new Error('Seçenek resimleri bulunamadı');
        }

        // Get filenames and randomly select questionCount questions
        const allQuestionFiles = Object.keys(questionImports)
            .map(extractFilename)
            .sort((a, b) => getQuestionNumber(a) - getQuestionNumber(b));

        // Rastgele questionCount kadar soru seç
        const selectedQuestionFiles = shuffleArray([...allQuestionFiles]).slice(0, questionCount);

        // Generate questions
        const questions = selectedQuestionFiles.map((questionFile) => {
            const questionNumber = getQuestionNumber(questionFile);
            const questionId = questionNumber.toString();
            
            try {
                // Tüm seçenekleri ve doğru cevapları bul
                const optionPaths = Object.keys(optionImports)
                    .filter(path => path.includes(`/Matris/${questionNumber}/`))
                    .map(path => ({
                        path,
                        letter: getOptionLetter(extractFilename(path)),
                        isAnswer: path.includes('cevap')
                    }))
                    .filter(opt => opt.letter); // Geçersiz harfleri filtrele

                if (optionPaths.length === 0) {
                    console.error(`Soru ${questionNumber} için seçenek bulunamadı`);
                    return null;
                }

                // Doğru cevabı bul
                const correctOption = optionPaths.find(opt => opt.isAnswer);
                if (!correctOption) {
                    console.error(`Soru ${questionNumber} için doğru cevap bulunamadı`);
                    return null;
                }

                // Her harf için seçenek oluştur
                const options = ['A', 'B', 'C', 'D', 'E'].map(letter => {
                    const option = optionPaths.find(opt => opt.letter === letter);
                    if (!option) {
                        console.error(`Soru ${questionNumber} için ${letter} seçeneği bulunamadı`);
                        return null;
                    }

                    return {
                        id: `${questionId}${letter}`,
                        imageUrl: option.path.replace('/public', ''),
                        text: ''
                    };
                });

                // Eksik seçenek varsa soruyu atla
                if (options.some(opt => !opt)) {
                    console.error(`Soru ${questionNumber} için eksik seçenek var`);
                    return null;
                }

                // Get video solution if exists
                const videoSolution = questionVideoMap[questionId];

                return {
                    id: questionId,
                    questionImageUrl: `/images/questions/${category}/Soru-${questionNumber}.webp`,
                    question: '',
                    options: shuffleArray(options),
                    correctOptionId: `${questionId}${correctOption.letter}`,
                    grade: 1,
                    subject: category,
                    solutionVideo: videoSolution ? {
                        url: `https://www.youtube.com/embed/${videoSolution.videoId}`,
                        title: videoSolution.title
                    } : undefined
                };
            } catch (error) {
                console.error(`Soru ${questionNumber} oluşturulurken hata:`, error);
                return null;
            }
        }).filter(Boolean); // Remove any null questions

        const validQuestions = questions.filter(Boolean);

        if (validQuestions.length === 0) {
            throw new Error('Hiç geçerli soru oluşturulamadı');
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Matris Testi',
            description: 'Matris mantık soruları',
            grade: 1,
            subject: category,
            questions: validQuestions
        };
    } catch (error) {
        console.error('Quiz oluşturulurken hata:', error);
        throw error;
    }
}
