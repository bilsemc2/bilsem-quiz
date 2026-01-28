// @ts-expect-error - mp3 import
import correctSound from './correct.mp3';
// @ts-expect-error - mp3 import
import wrongSound from './wrong.mp3';
// @ts-expect-error - mp3 import
import tickSound from './tick.mp3';
// @ts-expect-error - mp3 import
import timeoutSound from './timeout.mp3';
// @ts-expect-error - mp3 import
import nextSound from './next.mp3';
// @ts-expect-error - mp3 import
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
