import React, { useEffect } from 'react';
import '../muzik.css';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'confirm' | 'alert';
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Tamam',
    cancelText = 'İptal',
    type = 'confirm'
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="muzik-modal-overlay" onClick={onCancel}>
            <div className="muzik-modal-container muzik-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4">
                    <h3 className="muzik-modal-title">{title}</h3>
                </div>
                <div className="mb-7">
                    <p className="muzik-modal-message">{message}</p>
                </div>
                <div className="flex gap-3 justify-center">
                    {type === 'confirm' && (
                        <button className="muzik-btn muzik-btn-cancel" onClick={onCancel}>
                            {cancelText}
                        </button>
                    )}
                    <button className="muzik-btn muzik-btn-confirm" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
