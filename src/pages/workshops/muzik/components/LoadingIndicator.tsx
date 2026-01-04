import React from 'react';

interface LoadingIndicatorProps {
    message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    message = 'Analiz ediliyor...'
}) => {
    return (
        <div className="flex flex-col items-center gap-4 p-8 bg-indigo-50/10 rounded-2xl my-5 border border-indigo-500/10 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="italic text-indigo-400 font-medium">
                {message}
            </span>
        </div>
    );
};

export default LoadingIndicator;
