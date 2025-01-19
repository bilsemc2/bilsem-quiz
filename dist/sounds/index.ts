export const sounds = {
    correct: '/sounds/correct.mp3',
    wrong: '/sounds/wrong.mp3',
    tick: '/sounds/tick.mp3',
    timeout: '/sounds/timeout.mp3',
    next: '/sounds/next.mp3',
    complete: '/sounds/complete.mp3'
} as const;

export type SoundName = keyof typeof sounds;
