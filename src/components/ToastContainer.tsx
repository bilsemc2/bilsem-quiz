import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import { removeToast, subscribeToToasts, type ToastMessage } from './toast/toastStore';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToToasts((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  const handleClose = (id: string) => {
    removeToast(id);
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
