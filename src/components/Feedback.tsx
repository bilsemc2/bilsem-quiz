import React from 'react';

interface FeedbackProps {
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
    onClose?: () => void;
    permanent?: boolean;
}

export const Feedback: React.FC<FeedbackProps> = ({ message, type, show, onClose, permanent = false }) => {
    if (!show) return null;

    const icons = {
        success: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        error: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    };

    const containerClasses = permanent 
        ? "fixed bottom-4 right-4 z-50 transition-all duration-500" 
        : "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500";

    const baseClasses = permanent 
        ? "flex items-center px-5 py-3 rounded-lg shadow-lg text-white font-medium border border-white/10" 
        : "flex items-center px-6 py-3 rounded-full shadow-lg text-white font-medium";
    
    const typeClasses = {
        success: "bg-emerald-500",
        error: "bg-red-500",
        info: "bg-blue-500"
    };

    return (
        <div className={`${containerClasses} ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className={`${baseClasses} ${typeClasses[type]}`}>
                <div className="flex items-center">
                    {icons[type]}
                    <span>{message}</span>
                </div>
                
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="ml-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};
