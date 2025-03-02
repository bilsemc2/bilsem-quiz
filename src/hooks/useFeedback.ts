import { useState, useCallback, useEffect, useRef } from 'react';

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

    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const showFeedback = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setState({ message, type, show: true });
        
        timeoutRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, show: false }));
        }, 3000);
    }, []);

    const hideFeedback = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setState(prev => ({ ...prev, show: false }));
    }, []);

    return [state, { showFeedback, hideFeedback }];
}
