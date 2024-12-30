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

export function generateQuiz(): Quiz {
    const category = 'Matris';

    // Import all images from the public directory with category
    const questionImports = import.meta.glob('/public/images/questions/Matris/*.webp', { eager: true });
    const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });

    // Get filenames from the imports and convert to full paths
    const questionFiles = Object.keys(questionImports)
        .map(extractFilename)
        .sort((a, b) => getQuestionNumber(a) - getQuestionNumber(b));

    // Generate questions
    const questions = questionFiles.map((questionFile, index) => {
        const questionNumber = index + 1;
        const questionId = questionNumber.toString();
        
        // Find matching option files for this question
        const matchingOptions = Object.keys(optionImports)
            .filter(path => {
                const filename = extractFilename(path);
                const optionNumber = getQuestionNumber(filename);
                return optionNumber === questionNumber;
            })
            .map(extractFilename);

        // Find the correct answer first
        const correctOption = matchingOptions.find(filename => isCorrectAnswer(filename));
        if (!correctOption) {
            console.error(`No correct answer found for question ${questionNumber}`);
            return null;
        }

        // Get correct letter from the correct option
        const correctLetter = getOptionLetter(correctOption);
        if (!correctLetter) {
            console.error(`Could not extract correct letter from ${correctOption}`);
            return null;
        }

        // Create options array with correct mappings
        const options = ['A', 'B', 'C', 'D', 'E'].map(optionLetter => {
            const isCorrectOption = optionLetter === correctLetter;
            return {
                id: `${questionId}${optionLetter}`,
                imageUrl: `/images/options/${category}/${questionNumber}/Soru-${isCorrectOption ? 'cevap-' : ''}${questionNumber}${optionLetter}.webp`,
                text: ''
            };
        });

        // Get video solution if exists
        const videoSolution = questionVideoMap[questionId];

        const question = {
            id: questionId,
            questionImageUrl: `/images/questions/${category}/Soru-${questionNumber}.webp`,
            question: '',
            options: shuffleArray(options),
            correctOptionId: `${questionId}${correctLetter}`,
            grade: 1,
            subject: category,
            solutionVideo: videoSolution ? {
                url: `https://www.youtube.com/embed/${videoSolution.videoId}`,
                title: videoSolution.title
            } : undefined
        };

        return question;
    }).filter(Boolean); // Remove any null questions

    return {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Matris Testi',
        description: 'Matris mantık soruları',
        grade: 1,
        subject: category,
        questions: questions
    };
}
