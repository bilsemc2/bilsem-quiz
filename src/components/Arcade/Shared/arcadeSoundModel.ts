import type { AppSoundName } from '@/features/sound/model/soundCatalog';

export type ArcadeSoundEvent =
    | 'start'
    | 'launch'
    | 'hit'
    | 'success'
    | 'fail'
    | 'levelUp'
    | 'reward';

export const ARCADE_SOUND_EVENT_MAP: Record<ArcadeSoundEvent, AppSoundName> = {
    start: 'click',
    launch: 'slide',
    hit: 'pop',
    success: 'correct',
    fail: 'incorrect',
    levelUp: 'complete',
    reward: 'shing',
};

export const ARCADE_SOUND_THROTTLE_MS: Record<ArcadeSoundEvent, number> = {
    start: 120,
    launch: 120,
    hit: 90,
    success: 180,
    fail: 220,
    levelUp: 280,
    reward: 220,
};

export const getArcadeSoundName = (event: ArcadeSoundEvent): AppSoundName => (
    ARCADE_SOUND_EVENT_MAP[event]
);

export const getArcadeSoundThrottleMs = (event: ArcadeSoundEvent): number => (
    ARCADE_SOUND_THROTTLE_MS[event]
);
