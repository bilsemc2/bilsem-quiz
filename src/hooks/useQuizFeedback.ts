import { useState, useCallback } from 'react';

interface FeedbackState {
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
}

interface FeedbackActions {
    showFeedback: (message: string, type: 'success' | 'error' | 'info') => void;
    hideFeedback: () => void;
}

export const useQuizFeedback = (
    duration: number = 2000
): [FeedbackState, FeedbackActions] => {
    const [state, setState] = useState<FeedbackState>({
        message: '',
        type: 'info',
        show: false
    });

    const showFeedback = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setState({ message, type, show: true });
        setTimeout(() => {
            setState(prev => ({ ...prev, show: false }));
        }, duration);
    }, [duration]);

    const hideFeedback = useCallback(() => {
        setState(prev => ({ ...prev, show: false }));
    }, []);

    return [
        state,
        { showFeedback, hideFeedback }
    ];
};
