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
    'At': 'horse',
    'Aslan': 'lion',
    'Fil': 'elephant',
    'Zürafa': 'giraffe',
    'Maymun': 'monkey',
    'Ayı': 'bear',
    'Kurt': 'wolf',
    'Penguen': 'penguin',
    'Tavuk': 'chicken',
    'İnek': 'cow',
    'Koyun': 'sheep',
    'Keçi': 'goat',
    'Domuz': 'pig',
    'Yılan': 'snake',
    'Timsah': 'crocodile',
    'Zebra': 'zebra',
    'Papağan': 'parrot',
    'Kelebek': 'butterfly',
    'Kaplan': 'eagle',
    'Kus': 'duck'
    
};

const professionMap: { [key: string]: string } = {
    'Doktor': 'doctor',
    'Öğretmen': 'teacher',
    'Mühendis': 'engineer',
    'Aşçı': 'chef',
    'Avukat': 'lawyer',
    'Polis': 'police',
    'İtfaiyeci': 'firefighter',
    'Pilot': 'pilot',
    'Hemşire': 'nurse',
    'Diş Hekimi': 'dentist',
    'Mimar': 'architect',
    'Şoför': 'driver',
    'Garson': 'waiter',
    'Berber': 'barber',
    'Terzi': 'tailor',
    'Marangoz': 'carpenter',
    'Çiftçi': 'farmer',
    'Kasap': 'butcher',
    'Fırıncı': 'baker',
    'Bahçıvan': 'gardener',
    'Ressam': 'painter',
    'Müzisyen': 'musician',
    'Veteriner': 'veterinarian',
    'Eczacı': 'pharmacist',
    'Postacı': 'postman',
    'Elektrikçi': 'electrician',
    'Tesisatçı': 'plumber',
    'Gazeteci': 'journalist',
    'Bilim İnsanı': 'scientist',
    'Programcı': 'programmer',
    'Sanatçı': 'artist'
};

const fruitMap: { [key: string]: string } = {
    'Elma': 'apple',
    'Muz': 'banana',
    'Portakal': 'orange',
    'Çilek': 'strawberry',
    'Üzüm': 'grape',
    'Armut': 'pear',
    'Kiraz': 'cherry',
    'Karpuz': 'watermelon',
    'Limon': 'lemon',
    'Şeftali': 'peach',
    'Kayısı': 'apricot',
    'Erik': 'plum',
    'Ananas': 'pineapple',
    'Nar': 'pomegranate',
    'İncir': 'fig',
    'Mandalina': 'tangerine',
    'Kavun': 'melon',
    'Böğürtlen': 'blackberry',
    'Ahududu': 'raspberry',
    'Yaban Mersini': 'blueberry',
    'Dut': 'mulberry',
    'Kivi': 'kiwi',
    'Hindistan Cevizi': 'coconut',
    'Avokado': 'avocado',
    'Mango': 'mango',
    'Greyfurt': 'grapefruit'
};

const colorMap: { [key: string]: string } = {
    'Kırmızı': 'red',
    'Mavi': 'blue',
    'Yeşil': 'green',
    'Sarı': 'yellow',
    'Turuncu': 'orange',
    'Mor': 'purple',
    'Pembe': 'pink',
    'Kahverengi': 'brown',
    'Siyah': 'black',
    'Beyaz': 'white',
    'Gri': 'gray'
};

const renderShape = (value: string) => {
    // Eğer value bir meslek ise
    if (professionMap[value]) {
        return (
            <div className="w-16 h-16 relative flex items-center justify-center">
                <img
                    src={`/images/professions/${professionMap[value]}.png`}
                    alt={value}
                    width={64}
                    height={64}
                    className="object-contain"
                />
            </div>
        );
    }

    // Eğer value bir harf ise (type: letter)
    if (value.length === 1 && value.match(/[A-ZÇĞİÖŞÜ]/)) {
        return (
            <svg viewBox="0 0 40 40" className="w-full h-full">
                <text
                    x="50%"
                    y="50%"
                    fontSize="24"
                    fontWeight="bold"
                    fill="currentColor"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {value}
                </text>
            </svg>
        );
    }

    switch (value) {
        case 'Artı':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M15 5 L25 5 L25 15 L35 15 L35 25 L25 25 L25 35 L15 35 L15 25 L5 25 L5 15 L15 15 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Çapraz Yukarı Ok':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M10 30 L30 10 M25 10 L30 10 L30 15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Çapraz Aşağı Ok':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M10 10 L30 30 M25 30 L30 30 L30 25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Sola Ok':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M35 20 L10 20 M15 15 L10 20 L15 25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Sağa Ok':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M5 20 L30 20 M25 15 L30 20 L25 25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Yukarı Ok':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M20 35 L20 10 M15 15 L20 10 L25 15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Aşağı Ok':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M20 5 L20 30 M15 25 L20 30 L25 25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Modern Soru İşareti':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M12 12 C12 6, 28 6, 28 12 S20 16, 20 22 Q20 24, 20 26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <circle r="2.5" cx="20" cy="33" fill="currentColor" />
                </svg>
            );
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
        case 'Altıgen':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M30 10 L35 20 L30 30 L10 30 L5 20 L10 10 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Yıldız':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M20 5 L23 15 L33 15 L25 22 L28 32 L20 26 L12 32 L15 22 L7 15 L17 15 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Baklava':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                        d="M20 5 L35 20 L20 35 L5 20 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            );
        case 'Dikdörtgen':
            return (
                <svg viewBox="0 0 40 40" className="w-full h-full">
                    <rect
                        x="5"
                        y="10"
                        width="30"
                        height="20"
                        fill="none"
                        stroke="currentColor"
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
                                        style={{ backgroundColor: colorMap[cell.value] || cell.value }}
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
