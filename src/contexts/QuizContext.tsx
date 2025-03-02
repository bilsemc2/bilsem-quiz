import React, { createContext, useContext, useReducer } from 'react';
import { Quiz, QuizQuestion, Answer } from '../types/quiz';

interface QuizState {
    quiz: Quiz | null;
    currentQuestion: QuizQuestion | null;
    currentQuestionIndex: number;
    isAnswered: boolean;
    answers: Answer[];
    score: number;
    selectedOption: string | null;
    isSubmitting: boolean;
    isTimeout: boolean;
    showSolution: boolean;
}

interface QuizActions {
    setQuiz: (quiz: Quiz) => void;
    setCurrentQuestion: (question: QuizQuestion) => void;
    setCurrentQuestionIndex: (index: number) => void;
    setIsAnswered: (isAnswered: boolean) => void;
    addAnswer: (answer: Answer) => void;
    setScore: (score: number | ((prev: number) => number)) => void;
    setSelectedOption: (option: string | null) => void;
    setIsSubmitting: (value: boolean) => void;
    setIsTimeout: (value: boolean) => void;
    setShowSolution: (value: boolean) => void;
}

type QuizActionType =
    | { type: 'SET_QUIZ'; payload: Quiz }
    | { type: 'SET_CURRENT_QUESTION'; payload: QuizQuestion }
    | { type: 'SET_CURRENT_QUESTION_INDEX'; payload: number }
    | { type: 'SET_IS_ANSWERED'; payload: boolean }
    | { type: 'ADD_ANSWER'; payload: Answer }
    | { type: 'SET_SCORE'; payload: number | ((prev: number) => number) }
    | { type: 'SET_SELECTED_OPTION'; payload: string | null }
    | { type: 'SET_IS_SUBMITTING'; payload: boolean }
    | { type: 'SET_IS_TIMEOUT'; payload: boolean }
    | { type: 'SET_SHOW_SOLUTION'; payload: boolean };

const QuizContext = createContext<[QuizState, QuizActions] | null>(null);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initialState: QuizState = {
        quiz: null,
        currentQuestion: null,
        currentQuestionIndex: 0,
        isAnswered: false,
        answers: [],
        score: 0,
        selectedOption: null,
        isSubmitting: false,
        isTimeout: false,
        showSolution: false
    };

    const [state, dispatch] = useReducer((state: QuizState, action: QuizActionType) => {
        switch (action.type) {
            case 'SET_QUIZ':
                return { ...state, quiz: action.payload };
            case 'SET_CURRENT_QUESTION':
                return { ...state, currentQuestion: action.payload };
            case 'SET_CURRENT_QUESTION_INDEX':
                return { ...state, currentQuestionIndex: action.payload };
            case 'SET_IS_ANSWERED':
                return { ...state, isAnswered: action.payload };
            case 'ADD_ANSWER':
                return { ...state, answers: [...state.answers, action.payload] };
            case 'SET_SCORE':
                return { ...state, score: typeof action.payload === 'function' ? action.payload(state.score) : action.payload };
            case 'SET_SELECTED_OPTION':
                return { ...state, selectedOption: action.payload };
            case 'SET_IS_SUBMITTING':
                return { ...state, isSubmitting: action.payload };
            case 'SET_IS_TIMEOUT':
                return { ...state, isTimeout: action.payload };
            case 'SET_SHOW_SOLUTION':
                return { ...state, showSolution: action.payload };
            default:
                return state;
        }
    }, initialState);

    const actions: QuizActions = {
        setQuiz: (quiz) => dispatch({ type: 'SET_QUIZ', payload: quiz }),
        setCurrentQuestion: (question) => dispatch({ type: 'SET_CURRENT_QUESTION', payload: question }),
        setCurrentQuestionIndex: (index) => dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: index }),
        setIsAnswered: (isAnswered) => dispatch({ type: 'SET_IS_ANSWERED', payload: isAnswered }),
        addAnswer: (answer) => dispatch({ type: 'ADD_ANSWER', payload: answer }),
        setScore: (score) => dispatch({ type: 'SET_SCORE', payload: score }),
        setSelectedOption: (option) => dispatch({ type: 'SET_SELECTED_OPTION', payload: option }),
        setIsSubmitting: (value) => dispatch({ type: 'SET_IS_SUBMITTING', payload: value }),
        setIsTimeout: (value) => dispatch({ type: 'SET_IS_TIMEOUT', payload: value }),
        setShowSolution: (value) => dispatch({ type: 'SET_SHOW_SOLUTION', payload: value })
    };

    return (
        <QuizContext.Provider value={[state, actions]}>
            {children}
        </QuizContext.Provider>
    );
};

export const useQuiz = () => {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within a QuizProvider');
    }
    return context;
};
