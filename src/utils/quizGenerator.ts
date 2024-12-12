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
    console.log('Getting option letter for:', filename);
    
    // Önce "Soru-cevap-XXX" formatını kontrol et
    let match = filename.match(/Soru-cevap-\d+([A-E])/);
    if (match) {
        console.log('Matched Soru-cevap pattern:', match[1]);
        return match[1];
    }
    
    // Sonra "Soru-XXXA" formatını kontrol et
    match = filename.match(/Soru-\d+([A-E])/);
    if (match) {
        console.log('Matched Soru-XX pattern:', match[1]);
        return match[1];
    }
    
    // Son olarak "Soru-cevaba-XXX" formatını kontrol et
    match = filename.match(/Soru-cevaba?-\d+([A-E])/);
    if (match) {
        console.log('Matched Soru-cevaba pattern:', match[1]);
        return match[1];
    }

    console.warn('No option letter found in:', filename);
    return '';
}

function isCorrectAnswer(filename: string): boolean {
    const isCorrect = filename.toLowerCase().includes('-cevap-') || 
                     filename.toLowerCase().includes('-cevaba-') ||
                     filename.toLowerCase().includes('-cevab-');
    
    console.log('Checking if correct answer:', filename, isCorrect);
    return isCorrect;
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

function getOptionImageUrl(questionNumber: number, category: string, optionFile: string): string {
    return `/images/options/${category}/${questionNumber}/${optionFile}`;
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

        console.log(`\nProcessing Question ${questionNumber}:`);
        console.log('Matching options:', matchingOptions);

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

        console.log(`Correct option: ${correctOption} (Letter: ${correctLetter})`);

        // Create options array with correct mappings
        const options = matchingOptions.map(optionFile => {
            const optionLetter = getOptionLetter(optionFile);
            if (!optionLetter) {
                console.error(`Could not extract option letter from ${optionFile}`);
                return null;
            }

            console.log(`Processing option: ${optionFile} -> Letter: ${optionLetter}`);
            
            return {
                id: `${questionId}${optionLetter}`,
                imageUrl: getOptionImageUrl(questionNumber, category, optionFile),
                text: ''
            };
        }).filter(Boolean); // Remove any null options

        // Validate we have all 5 options
        if (options.length !== 5) {
            console.error(`Question ${questionNumber} has ${options.length} options instead of 5`);
            return null;
        }

        // Get video solution if exists
        const videoSolution = questionVideoMap[questionId];

        const question = {
            id: questionId,
            questionImageUrl: `/images/questions/${category}/${questionFile}`,
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

        console.log(`Question ${questionNumber} correctOptionId: ${question.correctOptionId}`);
        return question;
    }).filter(Boolean); // Remove any null questions

    return {
        id: '1',
        title: 'Bilsemc2- Yetenek ve Zeka',
        description: 'Yetenek ve Zeka Soruları',
        grade: 1,
        subject: 'Yetenek ve Zeka',
        questions
    };
}
