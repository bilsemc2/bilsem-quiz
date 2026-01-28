import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Modal from '../components/Modal';

interface ModalOptions {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
}

interface ModalContextType {
    confirm: (options: ModalOptions) => Promise<boolean>;
    alert: (options: ModalOptions) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'confirm' | 'alert';
    resolve: ((value: boolean | PromiseLike<boolean>) => void) | null;
}

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Tamam',
        cancelText: 'İptal',
        type: 'confirm',
        resolve: null,
    });

    const confirm = useCallback((options: ModalOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title: options.title || 'Onay',
                message: options.message || 'Emin misiniz?',
                confirmText: options.confirmText || 'Tamam',
                cancelText: options.cancelText || 'İptal',
                type: 'confirm',
                resolve,
            });
        });
    }, []);

    const alert = useCallback((options: ModalOptions): Promise<void> => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title: options.title || 'Uyarı',
                message: options.message || '',
                confirmText: options.confirmText || 'Tamam',
                cancelText: 'İptal',
                type: 'alert',
                resolve: () => resolve(),
            });
        });
    }, []);

    const handleConfirm = () => {
        if (modalState.resolve) modalState.resolve(true);
        setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        if (modalState.resolve) modalState.resolve(false);
        setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    return (
        <ModalContext.Provider value={{ confirm, alert }}>
            {children}
            <Modal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                type={modalState.type}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
