export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    autoClose?: boolean;
    duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

const toastsState: ToastMessage[] = [];
let listeners: ToastListener[] = [];

const notifyListeners = () => {
    const snapshot = [...toastsState];
    listeners.forEach((listener) => listener(snapshot));
};

export const addToast = (
    message: string,
    type: ToastType,
    options?: { autoClose?: boolean; duration?: number }
) => {
    const nextToast: ToastMessage = {
        id: Date.now().toString(),
        message,
        type,
        autoClose: options?.autoClose ?? true,
        duration: options?.duration ?? 3000
    };

    toastsState.push(nextToast);
    notifyListeners();
};

export const removeToast = (toastId: string) => {
    const index = toastsState.findIndex((toast) => toast.id === toastId);
    if (index === -1) {
        return;
    }

    toastsState.splice(index, 1);
    notifyListeners();
};

export const subscribeToToasts = (listener: ToastListener) => {
    listeners.push(listener);
    listener([...toastsState]);

    return () => {
        listeners = listeners.filter((item) => item !== listener);
    };
};
