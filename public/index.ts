// @ts-ignore
import correctSound from './correct.mp3';
// @ts-ignore
import wrongSound from './wrong.mp3';
// @ts-ignore
import tickSound from './tick.mp3';
// @ts-ignore
import timeoutSound from './timeout.mp3';
// @ts-ignore
import nextSound from './next.mp3';
// @ts-ignore
import completeSound from './complete.mp3';

export const sounds = {
    correct: correctSound,
    wrong: wrongSound,
    tick: tickSound,
    timeout: timeoutSound,
    next: nextSound,
    complete: completeSound
} as const;

export type SoundName = keyof typeof sounds;
