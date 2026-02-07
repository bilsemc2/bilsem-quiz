import React from 'react';

interface BadgeCardProps {
    name: string;
    description: string;
    icon: string;
    earnedAt?: string;
    isLocked?: boolean;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
    name,
    description,
    icon,
    earnedAt,
    isLocked = false
}) => {
    return (
        <div
            className="relative group cursor-pointer"
            title={isLocked ? "Bu rozeti kazanmak için kriterleri tamamlamalısın!" : description}
        >
            <div className={`
                badge-card w-28 h-36 rounded-xl p-4
                flex flex-col items-center justify-center gap-3
                transform transition-all duration-300 hover:scale-105
                ${isLocked ? 'bg-gray-100' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}
                border-2 ${isLocked ? 'border-gray-200' : 'border-indigo-100'}
                shadow-lg hover:shadow-xl
            `}>
                {/* Rozet İkonu */}
                <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    ${isLocked ? 'bg-gray-200' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}
                    shadow-lg border-4 ${isLocked ? 'border-gray-100' : 'border-indigo-200'}
                `}>
                    <span className={`text-2xl ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                        {icon}
                    </span>
                </div>

                {/* Rozet Adı */}
                <div className="text-center">
                    <h4 className={`text-sm font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                        {name}
                    </h4>

                    {/* Kazanılma Tarihi */}
                    {earnedAt && !isLocked && (
                        <p className="text-xs text-indigo-500 mt-1">
                            {new Date(earnedAt).toLocaleDateString('tr-TR')}
                        </p>
                    )}
                </div>

                {/* Kilitli Göstergesi */}
                {isLocked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🔒</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeCard;
