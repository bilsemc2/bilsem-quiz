import React, { useState, useEffect, useCallback } from 'react';
import Toast from './Toast';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  autoClose?: boolean;
  duration?: number;
}

// Singleton pattern - tüm uygulama için tek bir toast yöneticisi
let toastManager: {
  addToast: (message: string, type: ToastType, options?: { autoClose?: boolean, duration?: number }) => void;
  removeToast: (id: string) => void;
} | null = null;

let listeners: ((toasts: ToastMessage[]) => void)[] = [];

const updateListeners = (toasts: ToastMessage[]) => {
  listeners.forEach(listener => listener(toasts));
};

export const useToast = () => {
  const addToast = useCallback((message: string, type: ToastType, options?: { autoClose?: boolean, duration?: number }) => {
    if (toastManager) {
      toastManager.addToast(message, type, options);
    }
  }, []);

  return { addToast };
};

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!toastManager) {
      const toastsState: ToastMessage[] = [];

      toastManager = {
        addToast: (message, type, options) => {
          const id = Date.now().toString();
          const newToast: ToastMessage = { 
            id, 
            message, 
            type, 
            autoClose: options?.autoClose !== undefined ? options.autoClose : true,
            duration: options?.duration || 3000
          };
          
          toastsState.push(newToast);
          updateListeners([...toastsState]);
        },
        removeToast: (id) => {
          const index = toastsState.findIndex(toast => toast.id === id);
          if (index !== -1) {
            toastsState.splice(index, 1);
            updateListeners([...toastsState]);
          }
        }
      };
    }

    const listener = (updatedToasts: ToastMessage[]) => {
      setToasts(updatedToasts);
    };

    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const handleClose = (id: string) => {
    if (toastManager) {
      toastManager.removeToast(id);
    }
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          autoClose={toast.autoClose}
          duration={toast.duration}
          onClose={() => handleClose(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
