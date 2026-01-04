import React from 'react';

interface RecordingIndicatorProps {
    message?: string;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
    message = 'Kayıt yapılıyor...'
}) => {
    return (
        <div className="flex items-center gap-3 py-2 px-4 bg-red-500/10 rounded-full text-red-500 font-bold border border-red-500/20 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <span>{message}</span>
        </div>
    );
};

export default RecordingIndicator;
