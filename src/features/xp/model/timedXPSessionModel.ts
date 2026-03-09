export const TIMED_XP_INTERVAL_SECONDS = 60;
export const TIMED_XP_MIN_GAIN_GAP_MS = 45000;
export const TIMED_XP_SECONDS_STORAGE_KEY = 'xp_seconds_active';
export const TIMED_XP_LAST_GAIN_AT_STORAGE_KEY = 'xp_last_gain_at';

export interface TimedXPState {
    secondsActive: number;
    lastXPGainAt: number;
}

interface CreateTimedXPStateInput {
    storedSecondsActive: string | null;
    storedLastXPGainAt: string | null;
    now?: number;
}

interface ShouldGrantTimedXPInput {
    secondsActive: number;
    previousSecondsActive: number;
    lastXPGainAt: number;
    now: number;
    minGainGapMs?: number;
}

const toStoredInteger = (value: string | null): number | null => {
    if (value === null) {
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
};

export const clampTimedXPSeconds = (
    value: number,
    interval = TIMED_XP_INTERVAL_SECONDS
): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.min(Math.max(Math.floor(value), 0), Math.max(interval - 1, 0));
};

export const createTimedXPState = ({
    storedSecondsActive,
    storedLastXPGainAt,
    now = Date.now()
}: CreateTimedXPStateInput): TimedXPState => {
    const secondsActive = clampTimedXPSeconds(toStoredInteger(storedSecondsActive) ?? 0);
    const parsedLastGainAt = toStoredInteger(storedLastXPGainAt);

    return {
        secondsActive,
        lastXPGainAt:
            parsedLastGainAt && parsedLastGainAt > 0
                ? parsedLastGainAt
                : now - (secondsActive * 1000)
    };
};

export const readTimedXPStateFromStorage = (
    storage: Pick<Storage, 'getItem'>,
    now = Date.now()
): TimedXPState => {
    return createTimedXPState({
        storedSecondsActive: storage.getItem(TIMED_XP_SECONDS_STORAGE_KEY),
        storedLastXPGainAt: storage.getItem(TIMED_XP_LAST_GAIN_AT_STORAGE_KEY),
        now
    });
};

export const writeTimedXPStateToStorage = (
    storage: Pick<Storage, 'setItem'>,
    state: TimedXPState
) => {
    storage.setItem(TIMED_XP_SECONDS_STORAGE_KEY, String(state.secondsActive));
    storage.setItem(TIMED_XP_LAST_GAIN_AT_STORAGE_KEY, String(state.lastXPGainAt));
};

export const getNextTimedXPSeconds = (
    currentSecondsActive: number,
    interval = TIMED_XP_INTERVAL_SECONDS
) => {
    const nextValue = clampTimedXPSeconds(currentSecondsActive, interval) + 1;
    return nextValue >= interval ? 0 : nextValue;
};

export const shouldGrantTimedXP = ({
    secondsActive,
    previousSecondsActive,
    lastXPGainAt,
    now,
    minGainGapMs = TIMED_XP_MIN_GAIN_GAP_MS
}: ShouldGrantTimedXPInput) => (
    secondsActive === 0 &&
    previousSecondsActive !== 0 &&
    now - lastXPGainAt > minGainGapMs
);
