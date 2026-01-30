// Sound data for Noise Filter game
// Original data from dikkat/src/soundsData.js

export interface SoundItem {
    name: string;
    file: string;
    image: string;
}

export const sounds: SoundItem[] = [
    { name: 'Köpek', file: 'dog.mp3', image: 'dog.webp' },
    { name: 'Kedi', file: 'cat.mp3', image: 'cat.webp' },
    { name: 'Fil', file: 'elephant.mp3', image: 'elephant.webp' },
    { name: 'Ağlayan Bebek', file: 'baby.mp3', image: 'baby.webp' },
    { name: 'Motorsiklet', file: 'motorbike.mp3', image: 'motorbike.webp' },
    { name: 'Araba', file: 'car.mp3', image: 'car.webp' },
    { name: 'Formüle-1', file: 'f1.mp3', image: 'f1.webp' },
    { name: 'Horoz', file: 'rooster.mp3', image: 'rooster.webp' },
    { name: 'İnek', file: 'cow.mp3', image: 'cow.webp' },
    { name: 'Kuş', file: 'bird.mp3', image: 'bird.webp' },
    { name: 'At', file: 'horse.mp3', image: 'horse.webp' },
    { name: 'Uçan Kazlar', file: 'geese2.mp3', image: 'geese2.webp' },
    { name: 'Kaz', file: 'geese.mp3', image: 'geese.webp' },
    { name: 'Aslan', file: 'lion.mp3', image: 'lion.webp' },
    { name: 'Çekirge', file: 'cricket.mp3', image: 'cricket.webp' },
    { name: 'Eşek', file: 'donkey.mp3', image: 'donkey.webp' },
    { name: 'Gülen Bebek', file: 'babylaughs.mp3', image: 'babylaughs.webp' },
    { name: 'Müzik Kutusu', file: 'musicbox.mp3', image: 'musicbox.webp' },
    { name: 'Çıngıraklı Oyuncak', file: 'toyshaker.mp3', image: 'toyshaker.webp' },
    { name: 'Tren', file: 'train.mp3', image: 'train.webp' },
    { name: 'Stadyum', file: 'stadium.mp3', image: 'stadium.webp' },
    { name: 'Piyano', file: 'piano.mp3', image: 'piano.webp' },
    { name: 'Davul', file: 'drum.mp3', image: 'drum.webp' },
    { name: 'Gitar', file: 'guitar.mp3', image: 'guitar.webp' },
    { name: 'Keman', file: 'violin.mp3', image: 'violin.webp' },
    { name: 'Yunus', file: 'dolphin.mp3', image: 'dolphin.webp' },
    { name: 'Uçak', file: 'airplane.mp3', image: 'airplane.webp' },
    { name: 'Yağmur', file: 'rain.mp3', image: 'rain.webp' },
    { name: 'Şimşek', file: 'lightning.mp3', image: 'lightning.webp' },
    { name: 'Rüzgar', file: 'wind.mp3', image: 'wind.webp' },
    { name: 'Nehir', file: 'river.mp3', image: 'river.webp' },
    { name: 'Kurbağa', file: 'frog.mp3', image: 'frog.webp' },
    { name: 'Kuzu', file: 'sheep.mp3', image: 'sheep.webp' },
    { name: 'Keçi', file: 'goat.mp3', image: 'goat.webp' },
    { name: 'Sivrisinek', file: 'mosquito.mp3', image: 'mosquito.webp' },
    { name: 'Arı', file: 'bee.mp3', image: 'bee.webp' },
    { name: 'Balık', file: 'fish.mp3', image: 'fish.webp' },
    { name: 'Tavuk', file: 'chicken.mp3', image: 'chicken.webp' },
    { name: 'Baykuş', file: 'owl.mp3', image: 'owl.webp' },
    { name: 'Musluk', file: 'faucet-drips.mp3', image: 'faucet-drips.webp' },
    { name: 'Bıçak', file: 'knife.mp3', image: 'knife.webp' },
    { name: 'Denizaltı', file: 'submarine.mp3', image: 'submarine.webp' },
    { name: 'Yürümek', file: 'walk.mp3', image: 'walk.webp' },
    { name: 'Koşmak', file: 'man-running.mp3', image: 'man-running.webp' },
    { name: 'Kapı Vurma', file: 'knocking-on-door.mp3', image: 'knocking-on-door.webp' },
    { name: 'Açılan Kapı', file: 'door-open.mp3', image: 'door-open.webp' },
    { name: 'Islık', file: 'whistle.mp3', image: 'whistle.webp' },
    { name: 'Düdük', file: 'police-whistle.mp3', image: 'police-whistle.webp' },
    { name: 'Kamp Ateşi', file: 'campfire.mp3', image: 'campfire.webp' },
    { name: 'Karda Yürüyen', file: 'walking-on-snow.mp3', image: 'walking-on-snow.webp' },
    { name: 'Suda Yürüyen', file: 'walking-in-water.mp3', image: 'walking-in-water.webp' }
];

// Asset paths
export const AUDIO_BASE_PATH = '/assets/games/noise-filter/alt/';
export const IMAGE_BASE_PATH = '/assets/games/noise-filter/sesler/';
export const BACKGROUND_AUDIO = '/assets/games/noise-filter/ana.mp3';

// Helper functions
export const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const getRandomElement = <T>(array: T[]): T | null => {
    if (!array || array.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
};
