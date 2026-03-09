export interface DifficultyStreakState {
    correct: number;
    wrong: number;
}

export interface AdaptiveDifficultyState {
    difficulty: number;
    streak: DifficultyStreakState;
}

export const INITIAL_MUSIC_AI_DIFFICULTY = 2;
export const MIN_MUSIC_AI_DIFFICULTY = 1;
export const MAX_MUSIC_AI_DIFFICULTY = 5;
export const MAX_RECENT_MUSIC_AI_NOTES = 20;

export const appendRecentMusicNotes = (
    previousNotes: string[],
    nextNotes: string[] = []
) => {
    if (nextNotes.length === 0) {
        return previousNotes;
    }

    return [...previousNotes, ...nextNotes].slice(-MAX_RECENT_MUSIC_AI_NOTES);
};

export const advanceAdaptiveDifficulty = (
    currentState: AdaptiveDifficultyState,
    answeredCorrectly: boolean
): AdaptiveDifficultyState => {
    if (answeredCorrectly) {
        const nextCorrect = currentState.streak.correct + 1;
        if (nextCorrect >= 2) {
            return {
                difficulty: Math.min(MAX_MUSIC_AI_DIFFICULTY, currentState.difficulty + 1),
                streak: { correct: 0, wrong: 0 }
            };
        }

        return {
            difficulty: currentState.difficulty,
            streak: { correct: nextCorrect, wrong: 0 }
        };
    }

    const nextWrong = currentState.streak.wrong + 1;
    if (nextWrong >= 2) {
        return {
            difficulty: Math.max(MIN_MUSIC_AI_DIFFICULTY, currentState.difficulty - 1),
            streak: { correct: 0, wrong: 0 }
        };
    }

    return {
        difficulty: currentState.difficulty,
        streak: { correct: 0, wrong: nextWrong }
    };
};
