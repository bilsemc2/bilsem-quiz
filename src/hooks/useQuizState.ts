import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Quiz, Question } from '../types/quiz';
import { generateQuiz } from '../utils/quizGenerator';
import toast from 'react-hot-toast';

interface Answer {
    questionNumber: number;
    isCorrect: boolean;
    selectedOption: string | null;
    correctOption: string;
    questionImage: string;
    isTimeout: boolean;
    solutionVideo: string | null;
    options: Array<{
        id: string;
        imageUrl: string;
        isSelected: boolean;
        isCorrect: boolean;
    }>;
}

interface QuizState {
    quiz: Quiz | null;
    currentQuestionIndex: number;
    selectedOption: string | null;
    isAnswered: boolean;
    isTimeout: boolean;
    showSolution: boolean;
    score: number;
    answers: Answer[];
    isSubmitting: boolean;
    currentQuestion: Question | null;
    isLastQuestion: boolean;
}

interface QuizActions {
    setQuiz: (quiz: Quiz | null) => void;
    setCurrentQuestionIndex: (index: number) => void;
    setSelectedOption: (option: string | null) => void;
    setIsAnswered: (value: boolean) => void;
    setIsTimeout: (value: boolean) => void;
    setShowSolution: (value: boolean) => void;
    setScore: (score: number) => void;
    addAnswer: (answer: Answer) => void;
    setIsSubmitting: (value: boolean) => void;
    resetQuizState: () => void;
}

const XP_COST_PER_QUIZ = 10;

export const useQuizState = (): [QuizState, QuizActions] => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [state, setState] = useState<QuizState>({
        quiz: null,
        currentQuestionIndex: 0,
        selectedOption: null,
        isAnswered: false,
        isTimeout: false,
        showSolution: false,
        score: 0,
        answers: [],
        isSubmitting: false,
        currentQuestion: null,
        isLastQuestion: false
    });

    useEffect(() => {
        if (state.quiz) {
            setState(prev => ({
                ...prev,
                currentQuestion: state.quiz.questions[state.currentQuestionIndex],
                isLastQuestion: state.currentQuestionIndex === state.quiz.questions.length - 1
            }));
        }
    }, [state.quiz, state.currentQuestionIndex]);

    const loadQuiz = async () => {
        try {
            // Check if there's a saved quiz
            const savedQuiz = localStorage.getItem('currentQuiz');
            if (savedQuiz) {
                const parsedQuiz = JSON.parse(savedQuiz);
                if (!parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
                    throw new Error('Geçersiz quiz formatı');
                }

                setState(prev => ({ ...prev, quiz: parsedQuiz }));
                localStorage.removeItem('currentQuiz');
            } else {
                // If no homework quiz, generate a regular quiz
                const quizData = await generateQuiz(10);
                setState(prev => ({ ...prev, quiz: quizData }));
            }

            toast(`Quiz başladı! ${XP_COST_PER_QUIZ} XP harcandı.`);
        } catch (error) {
            console.error('Quiz yüklenirken hata:', error);
            toast.error('Quiz yüklenirken bir hata oluştu');
            navigate('/');
        }
    };

    useEffect(() => {
        if (user?.id && !state.quiz) {
            loadQuiz();
        }
    }, [user, location.pathname]);

    const actions: QuizActions = {
        setQuiz: (quiz) => setState(prev => ({ ...prev, quiz })),
        setCurrentQuestionIndex: (index) => setState(prev => ({ ...prev, currentQuestionIndex: index })),
        setSelectedOption: (option) => setState(prev => ({ ...prev, selectedOption: option })),
        setIsAnswered: (value) => setState(prev => ({ ...prev, isAnswered: value })),
        setIsTimeout: (value) => setState(prev => ({ ...prev, isTimeout: value })),
        setShowSolution: (value) => setState(prev => ({ ...prev, showSolution: value })),
        setScore: (score) => setState(prev => ({ ...prev, score })),
        addAnswer: (answer) => setState(prev => ({ ...prev, answers: [...prev.answers, answer] })),
        setIsSubmitting: (value) => setState(prev => ({ ...prev, isSubmitting: value })),
        resetQuizState: () => setState({
            quiz: null,
            currentQuestionIndex: 0,
            selectedOption: null,
            isAnswered: false,
            isTimeout: false,
            showSolution: false,
            score: 0,
            answers: [],
            isSubmitting: false,
            currentQuestion: null,
            isLastQuestion: false
        })
    };

    return [state, actions];
};
