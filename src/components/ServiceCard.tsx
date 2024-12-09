import React, { useState } from 'react';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: string;
    color?: string;
    features?: string[];
    type?: 'bronze' | 'silver' | 'gold' | 'trial';
    requiredLevel?: number;
    requiredXP?: number;
    currentLevel?: number;
    currentXP?: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ 
    title, 
    description, 
    icon, 
    color = 'border-gray-500',
    features = [],
    type = 'trial',
    requiredLevel = 0,
    requiredXP = 0,
    currentLevel = 0,
    currentXP = 0
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Tam olarak gereken XP'ye ulaşılması gerekiyor
    const isLocked = currentLevel < requiredLevel || currentXP < requiredXP;
    
    // Seviye ve XP durumunu kontrol et
    const levelStatus = currentLevel >= requiredLevel ? 'complete' : 'locked';
    const xpStatus = currentXP >= requiredXP ? 'complete' : 'locked';
    
    const getTypeDetails = (type: string) => {
        switch(type) {
            case 'gold':
                return {
                    badge: '🥇 Premium',
                    bgGradient: 'from-yellow-200 via-yellow-300 to-yellow-400'
                };
            case 'silver':
                return {
                    badge: '🥈 Pro',
                    bgGradient: 'from-gray-200 via-gray-300 to-gray-400'
                };
            case 'bronze':
                return {
                    badge: '🥉 Standart',
                    bgGradient: 'from-amber-200 via-amber-300 to-amber-400'
                };
            default:
                return {
                    badge: '🎯 Deneme',
                    bgGradient: 'from-green-200 via-green-300 to-green-400'
                };
        }
    };

    const typeDetails = getTypeDetails(type);

    const getProgressPercentage = () => {
        // Seviye yeterli değilse 0% göster
        if (currentLevel < requiredLevel) return 0;
        
        // Deneme grubu için her zaman 100% göster
        if (requiredXP === 0) return 100;
        
        // Seviye tamam ama XP eksikse, XP yüzdesini göster
        if (currentLevel >= requiredLevel) {
            return Math.min(100, Math.floor((currentXP / requiredXP) * 100));
        }
        
        return 0;
    };

    return (
        <div
            className={`relative bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 ${
                isHovered ? 'scale-105 shadow-xl' : ''
            } ${isLocked ? 'opacity-75' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Üst Gradient Banner */}
            <div className={`h-2 bg-gradient-to-r ${typeDetails.bgGradient}`} />

            {/* Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium 
                bg-white shadow-md border ${color}`}>
                {typeDetails.badge}
            </div>

            {/* Kilit İkonu (eğer kilitliyse) */}
            {isLocked && (
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gray-800 
                    flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            )}

            <div className="p-6">
                {/* Icon ve Başlık */}
                <div className="flex items-center space-x-4 mb-4">
                    <div className={`text-3xl ${color ? color.replace('border-', 'text-') : 'text-gray-500'}`}>
                        {icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                </div>

                {/* Açıklama */}
                <p className="text-gray-600 mb-4">{description}</p>

                {/* Seviye Gereksinimleri (eğer kilitliyse) */}
                {isLocked && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm font-medium mb-2">
                            <span className="text-gray-700">Seviye: {requiredLevel}</span>
                            <span className={levelStatus === 'complete' ? 'text-green-500' : 'text-red-500'}>
                                {currentLevel}/{requiredLevel}
                            </span>
                        </div>
                        {requiredXP > 0 && (
                            <>
                                <div className="flex items-center justify-between text-sm font-medium mb-2">
                                    <span className="text-gray-700">XP</span>
                                    <span className={xpStatus === 'complete' ? 'text-green-500' : 'text-red-500'}>
                                        {currentXP.toLocaleString()}/{requiredXP.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            xpStatus === 'complete' ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${getProgressPercentage()}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 text-center">
                                    {xpStatus === 'complete' 
                                        ? 'XP gereksinimi tamamlandı!' 
                                        : `${(requiredXP - currentXP).toLocaleString()} XP daha gerekiyor`}
                                </div>
                            </>
                        )}
                        
                        {/* Kilit Durumu Özeti */}
                        <div className="mt-3 text-center">
                            {isLocked ? (
                                <div className="text-sm text-red-500 font-medium">
                                    {levelStatus === 'locked' && xpStatus === 'locked' && 
                                        'Seviye ve XP gereksinimlerini tamamlayın'}
                                    {levelStatus === 'locked' && xpStatus === 'complete' && 
                                        'Gereken seviyeye ulaşın'}
                                    {levelStatus === 'complete' && xpStatus === 'locked' && 
                                        'Gereken XP\'ye ulaşın'}
                                </div>
                            ) : (
                                <div className="text-sm text-green-500 font-medium">
                                    Bu hizmet kullanıma hazır!
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Özellikler */}
                {features.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">Özellikler:</div>
                        <ul className="space-y-1">
                            {features.map((feature, index) => (
                                <li key={index} className={`flex items-center text-sm ${
                                    isLocked ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    <svg className={`w-4 h-4 mr-2 ${
                                        isLocked ? 'text-gray-400' : 'text-green-500'
                                    }`} 
                                        fill="none" strokeLinecap="round" 
                                        strokeLinejoin="round" strokeWidth="2" 
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
