// SevimliMantik — Question generation, answer checking, constants

export const INITIAL_LIVES = 3;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;

export type CreatureAction = 'jump' | 'spin' | 'move_right' | 'move_left' | 'shake' | 'idle' | 'grow';

export interface CreatureData {
    id: string;
    imageUrl: string;
    name: string;
    color: string;
    action: CreatureAction;
}

export interface RoundData {
    creatures: CreatureData[];
    instruction: string;
    options: { id: string; label: string; bgColor: string }[];
    correctOptionId: string;
}

export const CREATURES = [
    { imageUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Bibo&baseColor=3b82f6', name: 'Mavi Robot Bibo', id: 'botBlue', color: 'blue' },
    { imageUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Gogo&baseColor=22c55e', name: 'Yeşil Robot Gogo', id: 'botGreen', color: 'green' },
    { imageUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Pupu&baseColor=ec4899', name: 'Pembe Robot Pupu', id: 'botPink', color: 'pink' },
    { imageUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Yoyo&baseColor=eab308', name: 'Sarı Robot Yoyo', id: 'botYellow', color: 'yellow' },
    { imageUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Bobo&baseColor=78716c', name: 'Gri Robot Bobo', id: 'botGrey', color: 'grey' },
];

export const COLORS = [
    { label: 'Kırmızı', bgColor: 'from-red-500 to-red-600', id: 'red' },
    { label: 'Mavi', bgColor: 'from-blue-500 to-blue-600', id: 'blue' },
    { label: 'Yeşil', bgColor: 'from-green-500 to-green-600', id: 'green' },
    { label: 'Sarı', bgColor: 'from-yellow-400 to-amber-500', id: 'yellow' },
    { label: 'Mor', bgColor: 'from-purple-500 to-purple-600', id: 'purple' },
    { label: 'Turuncu', bgColor: 'from-orange-500 to-orange-600', id: 'orange' },
];

export const ACTIONS: { key: CreatureAction; text: string }[] = [
    { key: 'jump', text: 'zıplarsa' },
    { key: 'spin', text: 'dönerse' },
    { key: 'move_right', text: 'sağa giderse' },
    { key: 'move_left', text: 'sola giderse' },
    { key: 'shake', text: 'sallanırsa' },
    { key: 'grow', text: 'büyürse' },
    { key: 'idle', text: 'hareket etmezse' },
];

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => 0.5 - Math.random());

export type Difficulty = 'easy' | 'medium' | 'hard';
export const getDifficulty = (level: number): Difficulty => (level <= 7 ? 'easy' : level <= 14 ? 'medium' : 'hard');

export const generateRound = (level: number): RoundData => {
    const difficulty = getDifficulty(level);
    const selectedCreatures = shuffle(CREATURES).slice(0, 2);
    const selectedColors = shuffle(COLORS).slice(0, 2);
    const option1 = selectedColors[0];
    const option2 = selectedColors[1];

    const creatures: CreatureData[] = selectedCreatures.map((creature, index) => ({
        id: `c-${level}-${index}`,
        imageUrl: creature.imageUrl,
        name: creature.name,
        color: creature.color,
        action: pick(ACTIONS).key,
    }));

    const subjectCreature = creatures[0];
    const otherCreature = creatures[1];
    const conditionAction = pick(ACTIONS);

    let instruction: string;
    let correctOptionId: string;

    if (difficulty === 'easy' || (difficulty === 'medium' && Math.random() > 0.4)) {
        instruction = `Eğer ${subjectCreature.name} ${conditionAction.text}, ${option1.label} rengine tıkla. Aksi takdirde ${option2.label} rengine tıkla.`;
        const isMatch = subjectCreature.action === conditionAction.key;
        correctOptionId = isMatch ? option1.id : option2.id;
    } else {
        const secondAction = pick(ACTIONS);
        const isAnd = Math.random() > 0.5;
        const operatorText = isAnd ? 'VE' : 'VEYA';
        instruction = `Eğer ${subjectCreature.name} ${conditionAction.text} ${operatorText} ${otherCreature.name} ${secondAction.text}, ${option1.label} rengine tıkla. Aksi takdirde ${option2.label} rengine tıkla.`;
        const firstCondition = subjectCreature.action === conditionAction.key;
        const secondCondition = otherCreature.action === secondAction.key;
        const isMatch = isAnd ? firstCondition && secondCondition : firstCondition || secondCondition;
        correctOptionId = isMatch ? option1.id : option2.id;
    }

    return {
        creatures,
        instruction,
        options: selectedColors.map((color) => ({ id: color.id, label: color.label, bgColor: color.bgColor })),
        correctOptionId,
    };
};

export const CREATURE_BG: Record<string, string> = {
    blue: 'from-sky-300 to-sky-400 border-sky-500',
    green: 'from-green-300 to-green-400 border-green-500',
    pink: 'from-pink-300 to-pink-400 border-pink-500',
    yellow: 'from-yellow-300 to-yellow-400 border-yellow-500',
    grey: 'from-stone-300 to-stone-400 border-stone-500',
};

export const actionLabels: Record<CreatureAction, string> = {
    jump: '⬆️ Zıpladı',
    spin: '🔄 Döndü',
    move_right: '➡️ Sağa gitti',
    move_left: '⬅️ Sola gitti',
    shake: '↔️ Sallandı',
    idle: '🧘 Durdu',
    grow: '📏 Büyüdü',
};
