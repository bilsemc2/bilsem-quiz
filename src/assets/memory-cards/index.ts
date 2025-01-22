import cat from './cat.png';
import dog from './dog.png';
import elephant from './elephant.png';
import fox from './fox.png';
import panda from './panda.png';
import penguin from './penguin.png';

export interface MemoryCard {
    id: string;
    image: string;
    name: string;
}

export const MEMORY_CARDS: MemoryCard[] = [
    { id: 'cat', image: cat, name: 'Kedi' },
    { id: 'dog', image: dog, name: 'Köpek' },
    { id: 'elephant', image: elephant, name: 'Fil' },
    { id: 'fox', image: fox, name: 'Tilki' },
    { id: 'panda', image: panda, name: 'Panda' },
    { id: 'penguin', image: penguin, name: 'Penguen' },
];
