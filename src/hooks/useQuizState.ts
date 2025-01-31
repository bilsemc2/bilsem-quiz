import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Quiz, Question, Answer } from '../types/quiz';
import { generateQuiz } from '../utils/quizGenerator';
import { supabase } from '../lib/supabase';

interface DatabaseAssignment {
    id: string;
    title: string;
    description: string;
    questions: Question[];
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
    quizStarted: boolean;
}

interface QuizActions {
    setQuiz: (quiz: Quiz | null) => void;
    setCurrentQuestionIndex: (index: number) => void;
    setSelectedOption: (option: string | null) => void;
    setIsAnswered: (value: boolean) => void;
    getIsAnswered: () => boolean;
    setIsTimeout: (value: boolean) => void;
    setShowSolution: (value: boolean) => void;
    setScore: (value: number | ((prev: number) => number)) => void;
    addAnswer: (answer: Answer) => void;
    setIsSubmitting: (value: boolean) => void;
    resetQuizState: () => void;
    setQuizStarted: (value: boolean) => void;
}

export function useQuizState(): [QuizState, QuizActions] {
    const navigate = useNavigate();
    const auth = useAuth();
    const { user } = auth;
    const [state, setState] = useState<QuizState>({
        quiz: null,
        currentQuestionIndex: 0,
        quizStarted: false,
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

    const resetQuizState = useCallback(() => {
        setState({
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
            isLastQuestion: false,
            quizStarted: false
        });
    }, []);

    const setQuizStarted = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, quizStarted: value }));
    }, []);

    useEffect(() => {
        if (state.quiz) {
            const currentQuestion = state.quiz.questions[state.currentQuestionIndex];
            const isLastQuestion = state.currentQuestionIndex === state.quiz.questions.length - 1;
            setState(prev => ({ ...prev, currentQuestion, isLastQuestion }));
        }
    }, [state.quiz, state.currentQuestionIndex]);

    const loadAssignmentQuiz = async () => {
        try {
            const pathParts = window.location.pathname.split('/');
            const quizId = pathParts.pop();

            if (!quizId) {
                console.error('Quiz ID bulunamadı');
                navigate('/');
                return;
            }

            const { data, error } = await supabase
                .from('assignments')
                .select(`
                    id,
                    title,
                    description,
                    questions
                `)
                .eq('id', quizId)
                .single();

            if (error || !data) {
                console.error('Quiz yüklenirken hata:', error);
                navigate('/');
                return;
            }

            // Soruları doğru formata dönüştür
            const formattedQuestions = (data.questions as any[]).map(q => {
                const questionId = q.id.toString();
                const questionNumber = q.number;
                
                // Seçenekleri oluştur
                const options = q.options.map((opt: string) => {
                    const isCorrect = opt === q.correct_option;
                    const optionPath = isCorrect 
                        ? `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${opt}.webp`
                        : `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${opt}.webp`;
                    
                    return {
                        id: `${questionId}${opt}`,
                        text: opt,
                        imageUrl: optionPath,
                        isCorrect
                    };
                });

                return {
                    id: questionId,
                    questionImageUrl: `/images/questions/Matris/Soru-${questionNumber}.webp`,
                    question: q.text,
                    options,
                    correctOptionId: `${questionId}${q.correct_option}`,
                    points: q.points,
                    type: q.type,
                    difficulty: q.difficulty
                };
            });

            const quizData = {
                id: data.id,
                title: data.title,
                description: data.description,
                questions: formattedQuestions
            } as DatabaseAssignment;
            
            // Quiz verilerini düzenle
            const quiz: Quiz = {
                id: quizData.id,
                title: quizData.title,
                description: quizData.description,
                questions: quizData.questions || [],
                status: 'active',
                created_by: user?.id || '',
                is_active: true,
                isAssignment: true
            };

            if (!quiz.questions || quiz.questions.length === 0) {
                console.error('Geçersiz quiz formatı');
                navigate('/');
                return;
            }

            setState(prev => ({ ...prev, quiz }));
        } catch (error) {
            console.error('Quiz yüklenirken hata:', error);
            navigate('/');
        }
    };

    const loadQuiz = async () => {
        try {
            if (window.location.pathname.includes('/assignments/')) {
                await loadAssignmentQuiz();
            } else {
                const savedQuiz = localStorage.getItem('currentQuiz');
                if (savedQuiz) {
                    const parsedQuiz = JSON.parse(savedQuiz);
                    setState(prev => ({ ...prev, quiz: parsedQuiz }));
                    localStorage.removeItem('currentQuiz');
                } else {
                    const quizData = await generateQuiz(10);
                    setState(prev => ({ ...prev, quiz: quizData }));
                }
                console.log('Quiz başladı!');
            }
        } catch (error) {
            console.error('Quiz yüklenirken hata:', error);
            navigate('/');
        }
    };

    useEffect(() => {
        if (user?.id && !state.quiz) {
            loadQuiz();
        }
    }, [user]);

    const setIsAnswered = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, isAnswered: value }));
    }, []);

    const getIsAnswered = useCallback(() => {
        return state.isAnswered;
    }, [state.isAnswered]);

    const setIsTimeout = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, isTimeout: value }));
    }, []);

    const actions: QuizActions = {
        setQuiz: (quiz) => setState(prev => ({ ...prev, quiz })),
        setCurrentQuestionIndex: (index) => setState(prev => ({ ...prev, currentQuestionIndex: index })),
        setSelectedOption: (option) => setState(prev => ({ ...prev, selectedOption: option })),
        setIsAnswered,
        getIsAnswered,
        setIsTimeout,
        setShowSolution: (value) => setState(prev => ({ ...prev, showSolution: value })),
        setScore: (value) => setState(prev => ({
            ...prev,
            score: typeof value === 'function' ? value(prev.score) : value
        })),
        addAnswer: (answer) => setState(prev => ({ ...prev, answers: [...prev.answers, answer] })),
        setIsSubmitting: (value) => setState(prev => ({ ...prev, isSubmitting: value })),
        resetQuizState,
        setQuizStarted
    };

    return [state, actions];
}
