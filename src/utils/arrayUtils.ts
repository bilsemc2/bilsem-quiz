// Fisher-Yates shuffle algorithm
export function shuffleArray<T>(array: T[]): T[] {
    if (!Array.isArray(array)) {
        console.error('shuffleArray: Geçersiz dizi:', array);
        return [];
    }
    
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
