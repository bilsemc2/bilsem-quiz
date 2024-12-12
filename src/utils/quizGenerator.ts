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
    const match = filename.match(/Soru-(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

function getOptionLetter(filename: string): string {
    const match = filename.match(/Soru-\d+([A-E])/);
    return match ? match[1] : '';
}

function isCorrectAnswer(filename: string): boolean {
    return filename.toLowerCase().includes('-cevap-');
}

function findCorrectOptionLetter(optionFiles: string[]): string {
    const correctOption = optionFiles.find(filename => isCorrectAnswer(filename));
    if (!correctOption) {
        console.warn('No correct answer found in options, defaulting to A');
        return 'A';
    }
    const letter = getOptionLetter(correctOption);
    if (!letter) {
        console.warn('Could not extract option letter from correct answer, defaulting to A');
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
    const category = 'Matris'; // Quiz kategorisi

    // Import all images from the public directory with category
    const questionImports = import.meta.glob('/public/images/questions/Matris/*.webp', { eager: true });
    const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });

    // Get filenames from the imports
    const questionFiles = Object.keys(questionImports)
        .map(extractFilename)
        .sort((a, b) => getQuestionNumber(a) - getQuestionNumber(b));

    // Generate questions
    const questions = questionFiles.map((questionFile, index) => {
        const questionNumber = index + 1;
        const questionId = questionNumber.toString();
        
        // Find matching option files for this question
        const matchingOptions = Object.keys(optionImports)
            .filter(path => path.includes(`/options/${category}/${questionNumber}/`))
            .map(extractFilename);

        // Create options and shuffle them
        const options = shuffleArray(matchingOptions).map(optionFile => {
            const optionLetter = getOptionLetter(optionFile);
            return {
                id: `${questionId}${optionLetter}`,
                imageUrl: `${getQuestionOptionsPath(questionNumber, category)}/${optionFile}`,
                text: ''
            };
        });

        // Find the correct answer from filenames
        const correctOption = matchingOptions.find(filename => filename.includes('-cevap-'));
        const correctLetter = correctOption ? getOptionLetter(correctOption) : 'A';

        // Get video solution if exists
        const videoSolution = questionVideoMap[questionId];

        return {
            id: questionId,
            questionImageUrl: `/images/questions/${category}/${questionFile}`,
            question: '',
            options,
            correctOptionId: `${questionId}${correctLetter}`,
            grade: 1,
            subject: category,
            solutionVideo: videoSolution ? {
                url: `https://www.youtube.com/embed/${videoSolution.videoId}`,
                title: videoSolution.title
            } : undefined
        };
    });

    return {
        id: '1',
        title: 'Bilsemc2- Yetenek ve Zeka',
        description: 'Yetenek ve Zeka Soruları',
        grade: 1,
        subject: 'Yetenek ve Zeka',
        questions // Tüm soruları döndür, karıştırma
    };
}
