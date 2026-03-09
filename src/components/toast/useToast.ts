import { useCallback } from 'react';
import { addToast, type ToastType } from './toastStore';

export const useToast = () => {
    const pushToast = useCallback((
        message: string,
        type: ToastType,
        options?: { autoClose?: boolean; duration?: number }
    ) => {
        addToast(message, type, options);
    }, []);

    return { addToast: pushToast };
};
