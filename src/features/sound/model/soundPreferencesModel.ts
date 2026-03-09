export const SOUND_VOLUME_STORAGE_KEY = 'quizSoundVolume';
export const SOUND_MUTED_STORAGE_KEY = 'quizSoundMuted';
export const DEFAULT_SOUND_VOLUME = 50;
export const DEFAULT_SOUND_MUTED = false;

export interface SoundPreferences {
    volume: number;
    isMuted: boolean;
}

const clampVolume = (value: number) => {
    if (!Number.isFinite(value)) {
        return DEFAULT_SOUND_VOLUME;
    }

    return Math.min(Math.max(Math.round(value), 0), 100);
};

export const createSoundPreferences = ({
    storedVolume,
    storedMuted
}: {
    storedVolume: string | null;
    storedMuted: string | null;
}): SoundPreferences => ({
    volume: clampVolume(storedVolume === null ? DEFAULT_SOUND_VOLUME : Number(storedVolume)),
    isMuted: storedMuted === null ? DEFAULT_SOUND_MUTED : storedMuted === 'true'
});

export const readSoundPreferences = (storage: Pick<Storage, 'getItem'>): SoundPreferences => (
    createSoundPreferences({
        storedVolume: storage.getItem(SOUND_VOLUME_STORAGE_KEY),
        storedMuted: storage.getItem(SOUND_MUTED_STORAGE_KEY)
    })
);

export const writeSoundPreferences = (
    storage: Pick<Storage, 'setItem'>,
    preferences: SoundPreferences
) => {
    storage.setItem(SOUND_VOLUME_STORAGE_KEY, String(clampVolume(preferences.volume)));
    storage.setItem(SOUND_MUTED_STORAGE_KEY, String(preferences.isMuted));
};
