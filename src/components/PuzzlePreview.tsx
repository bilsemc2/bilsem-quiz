import React from 'react';

// İngilizce-Türkçe eşleştirme tabloları
const animalMap: { [key: string]: string } = {
    'Kedi': 'cat',
    'Köpek': 'dog',
    'Kuş': 'bird',
    'Balık': 'fish',
    'Tavşan': 'rabbit',
    'Kaplumbağa': 'turtle',
    'Fare': 'mouse',
    'At': 'horse'
};

const professionMap: { [key: string]: string } = {
    'Doktor': 'doctor',
    'Öğretmen': 'teacher',
    'Mühendis': 'engineer',
    'Aşçı': 'chef',
    'Avukat': 'lawyer',
    'Polis': 'police',
    'İtfaiyeci': 'firefighter',
    'Pilot': 'pilot'
};

const fruitMap: { [key: string]: string } = {
    'Elma': 'apple',
    'Muz': 'banana',
    'Portakal': 'orange',
    'Çilek': 'strawberry',
    'Üzüm': 'grape',
    'Armut': 'pear',
    'Kiraz': 'cherry',
    'Karpuz': 'watermelon'
};

const renderShape = (value: string) => {
    switch (value) {
        case '?':
            return (
                <svg viewBox="0 0 40 40" className="w-6 h-6">
                    <path
                        d="M20,30 L20,28 M20,25 L20,15 C25,15 28,13 28,10 C28,7 25,5 20,5 C15,5 12,7 12,10"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'Daire':
            return (
                <svg viewBox="0 0 40 40" className="w-6 h-6">
                    <circle cx="20" cy="20" r="15" stroke="currentColor" fill="none" strokeWidth="2" />
                </svg>
            );
        case 'Kare':
            return (
                <svg viewBox="0 0 40 40" className="w-6 h-6">
                    <rect x="5" y="5" width="30" height="30" stroke="currentColor" fill="none" strokeWidth="2" />
                </svg>
            );
        case 'Üçgen':
            return (
                <svg viewBox="0 0 40 40" className="w-6 h-6">
                    <polygon 
                        points="20,5 35,35 5,35" 
                        stroke="currentColor" 
                        fill="none" 
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Beşgen':
            return (
                <svg viewBox="0 0 40 40" className="w-6 h-6">
                    <polygon 
                        points="20,5 35,15 30,35 10,35 5,15"
                        stroke="currentColor" 
                        fill="none" 
                        strokeWidth="2"
                    />
                </svg>
            );
        default:
            return (
                <span className="text-lg font-bold text-gray-400">?</span>
            );
    }
};

interface PuzzlePreviewProps {
    grid: any[][];
    scale?: string;
}

export default function PuzzlePreview({ grid, scale = "scale-75" }: PuzzlePreviewProps) {
    return (
        <div className="grid grid-cols-3 gap-1 w-24 h-24">
            {grid.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className="w-8 h-8 border rounded flex items-center justify-center bg-gray-50"
                    >
                        {cell && (
                            <div className={`transform ${scale}`}>
                                {cell.type === 'animal' && (
                                    <img 
                                        src={`/images/animals/${animalMap[cell.value] || 'unknown'}.png`}
                                        alt={cell.value}
                                        className="w-6 h-6 object-contain"
                                    />
                                )}
                                {cell.type === 'profession' && (
                                    <img 
                                        src={`/images/professions/${professionMap[cell.value] || 'unknown'}.png`}
                                        alt={cell.value}
                                        className="w-6 h-6 object-contain"
                                    />
                                )}
                                {cell.type === 'fruit' && (
                                    <img 
                                        src={`/images/fruits/${fruitMap[cell.value] || 'unknown'}.png`}
                                        alt={cell.value}
                                        className="w-6 h-6 object-contain"
                                    />
                                )}
                                {cell.type === 'shape' && renderShape(cell.value)}
                                {cell.type === 'letter' && (
                                    <span className="text-lg font-bold">{cell.value}</span>
                                )}
                                {cell.type === 'number' && (
                                    <span className="text-lg font-bold">{cell.value}</span>
                                )}
                                {cell.type === 'color' && (
                                    <div 
                                        className="w-6 h-6 rounded-full" 
                                        style={{ backgroundColor: cell.value }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))
            ))}
        </div>
    );
}
