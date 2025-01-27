import { shuffleArray } from './arrayUtils';
import { MAX_QUESTION_NUMBER } from '../config/constants';

export interface Quiz {
    id: string;
    title: string;
    description: string;
    grade: number;
    subject: string;
    questions: Question[];
    status: 'pending' | 'completed';
    created_by: string;
    is_active: boolean;
}

export interface Question {
    id: string;
    questionImageUrl: string;
    question: string;
    options: Option[];
    correctOptionId: string;
    points: number;
    type: 'multiple_choice' | 'true_false';
    difficulty: 1 | 2 | 3;
}

interface Option {
    id: string;
    imageUrl: string;
    text: string;
}

export function extractFilename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
}

function getQuestionNumber(filename: string): number {
    const match = filename.match(/Soru-(\d+)/);
    if (!match) {
        return -1;
    }
    return parseInt(match[1], 10);
}

function getOptionLetter(filename: string): string {
    const match = filename.match(/[A-E](?=\.webp$)/);
    return match ? match[0] : '';
}

function isCorrectAnswer(filename: string): boolean {
    const lowerFilename = filename.toLowerCase();
    return lowerFilename.includes('-cevap-') && lowerFilename.endsWith('.webp');
}

export async function generateQuiz(questionCount: number = 10): Promise<Quiz> {
    try {
        // Import all images from the public directory
        const questionImports = import.meta.glob('/public/images/questions/Matris/*.webp', { eager: true });
        const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });

        if (Object.keys(questionImports).length === 0) {
            throw new Error('Soru resimleri bulunamadı');
        }

        if (Object.keys(optionImports).length === 0) {
            throw new Error('Seçenek resimleri bulunamadı');
        }

        // Tüm soru numaralarını topla
        const questionNumbers = Object.keys(questionImports)
            .map(path => getQuestionNumber(extractFilename(path)))
            .filter(num => num > 0 && num <= MAX_QUESTION_NUMBER);

        if (questionNumbers.length === 0) {
            throw new Error('Geçerli soru bulunamadı');
        }

        // Rastgele soru seç
        const selectedNumbers = shuffleArray([...questionNumbers]).slice(0, questionCount);
        const validQuestions: Question[] = [];

        // Her soru için seçenekleri ve doğru cevabı bul
        for (const questionNumber of selectedNumbers) {
            const questionId = `q${questionNumber}`;

            try {
                // Tüm seçenekleri ve doğru cevapları bul
                const optionPaths = Object.keys(optionImports)
                    .filter(path => path.includes(`/Matris/${questionNumber}/`))
                    .map(path => ({
                        path,
                        letter: getOptionLetter(extractFilename(path)),
                        isCorrect: isCorrectAnswer(extractFilename(path))
                    }))
                    .filter(option => option.letter); // Geçersiz harfleri filtrele

                if (optionPaths.length === 0) {
                    console.warn(`Soru ${questionNumber} için seçenek bulunamadı`);
                    continue;
                }

                // Doğru cevabı bul
                const correctOption = optionPaths.find(option => option.isCorrect);
                if (!correctOption) {
                    console.warn(`Soru ${questionNumber} için doğru cevap bulunamadı`);
                    continue;
                }

                // Normal seçenekleri bul (doğru cevap olmayan)
                const normalOptions = optionPaths
                    .filter(option => !option.isCorrect)
                    .map(option => ({
                        id: `${questionId}${option.letter}`,
                        text: '',
                        imageUrl: `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${option.letter}.webp`
                    }));

                if (normalOptions.length === 0) {
                    console.warn(`Soru ${questionNumber} için normal seçenek bulunamadı`);
                    continue;
                }

                // Doğru cevap seçeneğini ekle
                const options = [
                    ...normalOptions,
                    {
                        id: `${questionId}${correctOption.letter}`,
                        text: '',
                        imageUrl: `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${correctOption.letter}.webp`
                    }
                ];

                validQuestions.push({
                    id: questionId,
                    questionImageUrl: `/images/questions/Matris/Soru-${questionNumber}.webp`,
                    question: '',
                    options: shuffleArray(options),
                    correctOptionId: `${questionId}${correctOption.letter}`,
                    points: 10,
                    type: 'multiple_choice',
                    difficulty: 2
                });
            } catch (err) {
                console.error(`Soru ${questionNumber} işlenirken hata:`, err);
                continue;
            }
        }

        if (validQuestions.length === 0) {
            throw new Error('Hiç geçerli soru oluşturulamadı');
        }

        return {
            id: crypto.randomUUID(),
            title: 'Yeni Quiz',
            description: 'Otomatik oluşturulmuş quiz',
            questions: validQuestions,
            grade: 9,
            subject: 'Matematik',
            status: 'pending',
            created_by: '',
            is_active: true
        };
    } catch (error) {
        console.error('Quiz oluşturulurken hata:', error);
        throw error;
    }
}
