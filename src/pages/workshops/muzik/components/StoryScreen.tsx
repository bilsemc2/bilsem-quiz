import React from 'react';

interface StoryScreenProps {
    imageUrl: string;
    text: string;
    onPlayAudio?: () => void;
    playButtonLabel?: string;
    onContinue: () => void;
    continueButtonLabel?: string;
}

const StoryScreen: React.FC<StoryScreenProps> = ({
    imageUrl,
    text,
    onPlayAudio,
    playButtonLabel = 'Dinle',
    onContinue,
    continueButtonLabel = 'Devam Et'
}) => {
    return (
        <div className="text-center">
            <img
                src={imageUrl}
                alt="Bilgilendirme"
                className="max-w-[90%] max-h-[350px] mx-auto block rounded-3xl mb-8 shadow-2xl border border-white/20"
            />
            <p className="text-lg my-4 text-indigo-900 dark:text-indigo-100 font-medium">
                {text}
            </p>

            {onPlayAudio && (
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={onPlayAudio}
                        className="py-3 px-8 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2 mx-auto"
                    >
                        <span>🔊</span> {playButtonLabel}
                    </button>
                </div>
            )}

            <button
                onClick={onContinue}
                className="py-4 px-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20 text-white rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1"
            >
                {continueButtonLabel}
            </button>
        </div>
    );
};

export default StoryScreen;
