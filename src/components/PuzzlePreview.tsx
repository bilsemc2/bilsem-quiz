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
    'Kus': 'duck',
    'Baykuş':'owl'
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
    'İnşaat İşçisi': 'construction',
    'Astronot': 'astronaut',
    'Bilim İnsanı': 'scientist',
    'Çiftçi': 'farmer',
    'Sanatçı': 'artist',
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
    'Programcı': 'programmer'
};

const fruitMap: { [key: string]: string } = {
    'Elma': 'apple',
    'Muz': 'banana',
    'Portakal': 'orange',
    'Çilek': 'strawberry',
    'Üzüm': 'grapes',
    'Armut': 'pear',
    'Kiraz': 'cherries',
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
    'Gri': 'gray',
    'Lacivert':'navy'
};

const bilsemc2Map: { [key: string]: string } = {
    'Daire': 'circle',
    'Kare': 'square',
    'Üçgen': 'triangle',
    'Beşgen': 'pentagon',
    'Dikdörtgen': 'rectangle',
    'Altıgen': 'hexagon',
    'Yıldız': 'star',
    'Baklava': 'diamond',
    'Oval': 'oval',
    'Kalp': 'heart',
    'Artı': 'cross',
    'Soru İşareti': 'question',
    'Sağa Ok': 'arrow-right',
    'Sola Ok': 'arrow-left'
};

const renderShape = (item: any) => {
    if (!item) return null;

    // Eğer item bir bilsemc2 öğesi ise
    if (item.type === 'bilsemc2') {
        return (
            <div className="aspect-square relative flex items-center justify-center">
                <img
                    src={`/images/bilsemc2/${bilsemc2Map[item.value]}.svg`}
                    alt={item.value}
                    className="w-2/3 sm:w-3/4 h-2/3 sm:h-3/4 object-contain"
                />
            </div>
        );
    }
    
    // Eğer item bir meslek ise
    if (item.type === 'profession') {
        return (
            <div className="aspect-square relative flex items-center justify-center">
                <img
                    src={`/images/professions/${professionMap[item.value]}.png`}
                    alt={item.value}
                    className="w-2/3 sm:w-3/4 h-2/3 sm:h-3/4 object-contain"
                />
            </div>
        );
    }

    // Eğer item bir hayvan ise
    if (item.type === 'animal') {
        return (
            <div className="aspect-square relative flex items-center justify-center">
                <img
                    src={`/images/animals/${animalMap[item.value]}.png`}
                    alt={item.value}
                    className="w-2/3 sm:w-3/4 h-2/3 sm:h-3/4 object-contain"
                />
            </div>
        );
    }

    // Eğer item bir meyve ise
    if (item.type === 'fruit') {
        return (
            <div className="aspect-square relative flex items-center justify-center">
                <img
                    src={`/images/fruits/${fruitMap[item.value]}.png`}
                    alt={item.value}
                    className="w-2/3 sm:w-3/4 h-2/3 sm:h-3/4 object-contain"
                />
            </div>
        );
    }

    // Eğer item bir renk ise
    if (item.type === 'color') {
        return (
            <div className="aspect-square relative flex items-center justify-center">
                <img
                    src={`/images/colors/${colorMap[item.value]}.png`}
                    alt={item.value}
                    className="w-2/3 sm:w-3/4 h-2/3 sm:h-3/4 object-contain"
                />
            </div>
        );
    }

    // Eğer item bir harf ise (type: letter)
    if (item.type === 'letter') {
        return (
            <div className="aspect-square relative flex items-center justify-center">
                <span className="text-2xl sm:text-4xl font-bold">{item.value}</span>
            </div>
        );
    }

    // Eğer item bir sayı ise (type: number)
    if (item.type === 'number') {
        return (
            <div className="aspect-square relative flex items-center justify-center">
                <span className="text-2xl sm:text-4xl font-bold">{item.value}</span>
            </div>
        );
    }

    return null;
};

interface PuzzlePreviewProps {
    grid: any[][];
    scale?: string;
    size?: 'sm' | 'md' | 'lg';
}

const PuzzlePreview: React.FC<PuzzlePreviewProps> = ({ grid, scale = "scale-75", size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-[160px] sm:w-[180px] md:w-[200px]',
        md: 'w-[200px] sm:w-[250px] md:w-[300px]',
        lg: 'w-[280px] sm:w-[350px] md:w-[400px]'
    };

    return (
        <div className={`grid grid-cols-3 gap-1 sm:gap-2 ${scale} aspect-square ${sizeClasses[size]}`}>
            {grid.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className="aspect-square border rounded flex items-center justify-center bg-white p-1 sm:p-2"
                    >
                        {renderShape(cell)}
                    </div>
                ))
            ))}
        </div>
    );
};

export default PuzzlePreview;
