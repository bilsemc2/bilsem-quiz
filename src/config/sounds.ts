export type SoundName = 'correct' | 'incorrect' | 'time-warning' | 'next' | 'complete' | 'timeout';

export const sounds: Record<SoundName, string> = {
    'correct': '/sounds/correct.mp3',
    'incorrect': '/sounds/incorrect.mp3',
    'time-warning': '/sounds/time-warning.mp3',
    'next': '/sounds/next.mp3',
    'complete': '/sounds/complete.mp3',
    'timeout': '/sounds/timeout.mp3'
};
