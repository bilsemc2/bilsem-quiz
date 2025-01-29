import { useState, useCallback } from 'react';

export interface FeedbackState {
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
}

export interface FeedbackActions {
    showFeedback: (message: string, type: 'success' | 'error' | 'info') => void;
    hideFeedback: () => void;
}

export function useFeedback(): [FeedbackState, FeedbackActions] {
    const [state, setState] = useState<FeedbackState>({
        message: '',
        type: 'info',
        show: false
    });

    const showFeedback = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setState({ message, type, show: true });
        setTimeout(() => {
            setState(prev => ({ ...prev, show: false }));
        }, 3000);
    }, []);

    const hideFeedback = useCallback(() => {
        setState(prev => ({ ...prev, show: false }));
    }, []);

    return [state, { showFeedback, hideFeedback }];
}
