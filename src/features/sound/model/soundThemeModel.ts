import type { AppSoundName } from './soundCatalog';

export type LegacySoftSoundName =
    | 'correct'
    | 'incorrect'
    | 'timeout'
    | 'tick'
    | 'timeWarning'
    | 'time-warning'
    | 'next'
    | 'complete'
    | 'flip'
    | 'match'
    | 'win'
    | 'pop'
    | 'wrong';

export type SoftSoundRecipeName =
    | 'softClick'
    | 'softTick'
    | 'softLaunch'
    | 'softPop'
    | 'softSuccess'
    | 'softReward'
    | 'softFail'
    | 'softWarning'
    | 'softComplete'
    | 'softMystery'
    | 'softSparkle';

export type SoftSoundTimbre =
    | 'feltPluck'
    | 'glassBell'
    | 'airFlute'
    | 'bubbleTone';

export interface SoftSoundTone {
    frequency: number;
    durationMs: number;
    offsetMs: number;
    gain: number;
    type: OscillatorType;
    slideToFrequency?: number;
    detuneCents?: number;
    timbre?: SoftSoundTimbre;
    pan?: number;
}

export interface SoftSoundRecipe {
    attackMs: number;
    releaseMs: number;
    lowpassHz: number;
    masterGain: number;
    echoDelayMs?: number;
    echoGain?: number;
    tones: SoftSoundTone[];
}

export const SOFT_SOUND_RECIPES: Record<SoftSoundRecipeName, SoftSoundRecipe> = {
    softClick: {
        attackMs: 8,
        releaseMs: 120,
        lowpassHz: 2200,
        masterGain: 0.17,
        tones: [
            {
                frequency: 587.33,
                slideToFrequency: 554.37,
                durationMs: 72,
                offsetMs: 0,
                gain: 0.5,
                type: 'triangle',
                timbre: 'feltPluck',
            },
            {
                frequency: 880,
                durationMs: 46,
                offsetMs: 18,
                gain: 0.16,
                type: 'sine',
                timbre: 'airFlute',
                pan: 0.12,
            },
        ],
    },
    softTick: {
        attackMs: 4,
        releaseMs: 78,
        lowpassHz: 2400,
        masterGain: 0.12,
        tones: [
            {
                frequency: 659.25,
                durationMs: 42,
                offsetMs: 0,
                gain: 0.28,
                type: 'sine',
                timbre: 'airFlute',
            },
            {
                frequency: 783.99,
                durationMs: 34,
                offsetMs: 28,
                gain: 0.12,
                type: 'sine',
                timbre: 'glassBell',
            },
        ],
    },
    softLaunch: {
        attackMs: 10,
        releaseMs: 160,
        lowpassHz: 2350,
        masterGain: 0.18,
        echoDelayMs: 110,
        echoGain: 0.05,
        tones: [
            {
                frequency: 392.0,
                slideToFrequency: 523.25,
                durationMs: 96,
                offsetMs: 0,
                gain: 0.44,
                type: 'triangle',
                timbre: 'feltPluck',
                pan: -0.1,
            },
            {
                frequency: 659.25,
                durationMs: 58,
                offsetMs: 64,
                gain: 0.18,
                type: 'sine',
                timbre: 'glassBell',
                pan: 0.14,
            },
        ],
    },
    softPop: {
        attackMs: 4,
        releaseMs: 96,
        lowpassHz: 2500,
        masterGain: 0.15,
        tones: [
            {
                frequency: 466.16,
                slideToFrequency: 622.25,
                durationMs: 62,
                offsetMs: 0,
                gain: 0.52,
                type: 'triangle',
                timbre: 'bubbleTone',
            },
            {
                frequency: 932.33,
                durationMs: 34,
                offsetMs: 14,
                gain: 0.13,
                type: 'sine',
                timbre: 'glassBell',
                detuneCents: 8,
            },
        ],
    },
    softSuccess: {
        attackMs: 12,
        releaseMs: 220,
        lowpassHz: 2550,
        masterGain: 0.2,
        echoDelayMs: 125,
        echoGain: 0.05,
        tones: [
            {
                frequency: 392.0,
                durationMs: 86,
                offsetMs: 0,
                gain: 0.26,
                type: 'triangle',
                timbre: 'feltPluck',
                pan: -0.08,
            },
            {
                frequency: 523.25,
                durationMs: 108,
                offsetMs: 66,
                gain: 0.3,
                type: 'triangle',
                timbre: 'glassBell',
            },
            {
                frequency: 659.25,
                durationMs: 168,
                offsetMs: 136,
                gain: 0.34,
                type: 'sine',
                timbre: 'airFlute',
                pan: 0.08,
            },
        ],
    },
    softReward: {
        attackMs: 9,
        releaseMs: 190,
        lowpassHz: 2850,
        masterGain: 0.17,
        echoDelayMs: 92,
        echoGain: 0.06,
        tones: [
            {
                frequency: 523.25,
                durationMs: 74,
                offsetMs: 0,
                gain: 0.24,
                type: 'sine',
                timbre: 'glassBell',
                pan: -0.1,
            },
            {
                frequency: 783.99,
                durationMs: 98,
                offsetMs: 54,
                gain: 0.28,
                type: 'triangle',
                timbre: 'glassBell',
            },
            {
                frequency: 987.77,
                durationMs: 110,
                offsetMs: 118,
                gain: 0.18,
                type: 'sine',
                timbre: 'airFlute',
                pan: 0.12,
            },
        ],
    },
    softFail: {
        attackMs: 10,
        releaseMs: 220,
        lowpassHz: 1800,
        masterGain: 0.14,
        tones: [
            {
                frequency: 392.0,
                durationMs: 88,
                offsetMs: 0,
                gain: 0.26,
                type: 'triangle',
                timbre: 'feltPluck',
            },
            {
                frequency: 329.63,
                durationMs: 138,
                offsetMs: 84,
                gain: 0.22,
                type: 'sine',
                timbre: 'airFlute',
                pan: -0.06,
            },
        ],
    },
    softWarning: {
        attackMs: 7,
        releaseMs: 132,
        lowpassHz: 1950,
        masterGain: 0.13,
        tones: [
            {
                frequency: 554.37,
                durationMs: 74,
                offsetMs: 0,
                gain: 0.22,
                type: 'triangle',
                timbre: 'feltPluck',
            },
            {
                frequency: 493.88,
                durationMs: 102,
                offsetMs: 88,
                gain: 0.18,
                type: 'sine',
                timbre: 'airFlute',
            },
        ],
    },
    softComplete: {
        attackMs: 14,
        releaseMs: 280,
        lowpassHz: 3050,
        masterGain: 0.2,
        echoDelayMs: 145,
        echoGain: 0.08,
        tones: [
            {
                frequency: 392.0,
                durationMs: 86,
                offsetMs: 0,
                gain: 0.22,
                type: 'triangle',
                timbre: 'feltPluck',
                pan: -0.12,
            },
            {
                frequency: 523.25,
                durationMs: 92,
                offsetMs: 62,
                gain: 0.24,
                type: 'triangle',
                timbre: 'glassBell',
                pan: -0.04,
            },
            {
                frequency: 659.25,
                durationMs: 108,
                offsetMs: 126,
                gain: 0.28,
                type: 'triangle',
                timbre: 'glassBell',
                pan: 0.06,
            },
            {
                frequency: 783.99,
                durationMs: 172,
                offsetMs: 194,
                gain: 0.3,
                type: 'sine',
                timbre: 'airFlute',
                pan: 0.14,
            },
        ],
    },
    softMystery: {
        attackMs: 9,
        releaseMs: 165,
        lowpassHz: 1850,
        masterGain: 0.13,
        echoDelayMs: 96,
        echoGain: 0.04,
        tones: [
            {
                frequency: 349.23,
                durationMs: 84,
                offsetMs: 0,
                gain: 0.22,
                type: 'triangle',
                timbre: 'feltPluck',
                pan: -0.14,
            },
            {
                frequency: 415.3,
                durationMs: 102,
                offsetMs: 74,
                gain: 0.16,
                type: 'sine',
                timbre: 'airFlute',
                pan: 0.12,
                detuneCents: -4,
            },
        ],
    },
    softSparkle: {
        attackMs: 5,
        releaseMs: 155,
        lowpassHz: 3200,
        masterGain: 0.14,
        echoDelayMs: 88,
        echoGain: 0.05,
        tones: [
            {
                frequency: 783.99,
                durationMs: 54,
                offsetMs: 0,
                gain: 0.18,
                type: 'sine',
                timbre: 'glassBell',
                pan: -0.1,
            },
            {
                frequency: 1046.5,
                durationMs: 78,
                offsetMs: 32,
                gain: 0.22,
                type: 'sine',
                timbre: 'glassBell',
            },
            {
                frequency: 1318.51,
                durationMs: 86,
                offsetMs: 80,
                gain: 0.14,
                type: 'sine',
                timbre: 'airFlute',
                pan: 0.1,
            },
        ],
    },
};

export const APP_SOUND_RECIPE_MAP: Record<AppSoundName, SoftSoundRecipeName> = {
    correct: 'softSuccess',
    incorrect: 'softFail',
    tick: 'softTick',
    timeWarning: 'softWarning',
    select: 'softClick',
    pop: 'softPop',
    complete: 'softComplete',
    slide: 'softLaunch',
    shing: 'softSparkle',
    cosmic_pop: 'softSparkle',
    cosmic_success: 'softComplete',
    cosmic_fail: 'softFail',
    radar_beep: 'softTick',
    radar_scan: 'softMystery',
    radar_warning: 'softWarning',
    radar_correct: 'softSuccess',
    radar_incorrect: 'softFail',
    detective_click: 'softClick',
    detective_mystery: 'softMystery',
    detective_clue: 'softReward',
    detective_correct: 'softReward',
    detective_incorrect: 'softFail',
    memory_flip: 'softClick',
    memory_match: 'softReward',
    memory_fail: 'softFail',
    memory_shuffle: 'softLaunch',
    signal_appear: 'softPop',
    signal_disappear: 'softTick',
    signal_correct: 'softSuccess',
    signal_wrong: 'softFail',
    grid_flip: 'softClick',
    grid_match: 'softReward',
    grid_fail: 'softFail',
    grid_error: 'softWarning',
    flow_next: 'softLaunch',
    flow_correct: 'softSuccess',
    flow_wrong: 'softFail',
    flow_splash: 'softSparkle',
    success: 'softReward',
    wrong: 'softFail',
    click: 'softClick',
};

export const LEGACY_SOUND_RECIPE_MAP: Record<LegacySoftSoundName, SoftSoundRecipeName> = {
    correct: 'softSuccess',
    incorrect: 'softFail',
    timeout: 'softWarning',
    tick: 'softTick',
    timeWarning: 'softWarning',
    'time-warning': 'softWarning',
    next: 'softLaunch',
    complete: 'softComplete',
    flip: 'softClick',
    match: 'softReward',
    win: 'softComplete',
    pop: 'softPop',
    wrong: 'softFail',
};

export const getSoftSoundRecipeName = (soundName: AppSoundName): SoftSoundRecipeName => (
    APP_SOUND_RECIPE_MAP[soundName]
);

export const getLegacySoftSoundRecipeName = (soundName: LegacySoftSoundName): SoftSoundRecipeName => (
    LEGACY_SOUND_RECIPE_MAP[soundName]
);
