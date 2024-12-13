import React from 'react';

interface FeedbackProps {
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
}

export const Feedback: React.FC<FeedbackProps> = ({ message, type, show }) => {
    if (!show) return null;

    const baseClasses = "fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-medium transition-all duration-500 z-50";
    
    const typeClasses = {
        success: "bg-emerald-500",
        error: "bg-red-500",
        info: "bg-blue-500"
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]} ${show ? 'opacity-100' : 'opacity-0'}`}>
            {message}
        </div>
    );
};
