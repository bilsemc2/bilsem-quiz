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

function getQuestionNumber(filename: string): number {
    const match = filename.match(/Soru-(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

function getOptionLetter(filename: string): string {
    const match = filename.match(/Soru-\d+([A-E])/);
    return match ? match[1] : '';
}

function isCorrectAnswer(filename: string): boolean {
    return filename.includes('-cevap-');
}

function findCorrectOptionLetter(optionFiles: string[]): string {
    const correctOption = optionFiles.find(filename => isCorrectAnswer(filename));
    if (correctOption) {
        return getOptionLetter(correctOption);
    }
    return 'A'; // Fallback to A if no correct answer is marked
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

        // Find the correct answer from filenames
        const correctLetter = findCorrectOptionLetter(matchingOptions);

        // Create options and shuffle them
        const options = shuffleArray(matchingOptions).map(optionFile => {
            const optionLetter = getOptionLetter(optionFile);
            return {
                id: `${questionId}${optionLetter}`,
                imageUrl: `${getQuestionOptionsPath(questionNumber, category)}/${optionFile}`,
                text: ''
            };
        });

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
        questions: shuffleArray(questions).slice(0, 10) // Her quiz'de rastgele 10 soru
    };
}
