const clampNormalizedVolume = (value: number) => Math.min(Math.max(value, 0), 1);

const clampGlobalVolume = (value: number) => Math.min(Math.max(value, 0), 100) / 100;

export const getNoiseFilterTargetVolume = (
  globalVolume: number,
  isMuted: boolean,
) => {
  if (isMuted) {
    return 0;
  }

  return clampGlobalVolume(globalVolume);
};

export const getNoiseFilterBackgroundVolume = (
  backgroundVolume: number,
  globalVolume: number,
  isMuted: boolean,
) => {
  if (isMuted) {
    return 0;
  }

  return clampNormalizedVolume(backgroundVolume) * clampGlobalVolume(globalVolume);
};

export const canPlayNoiseFilterAudio = (
  globalVolume: number,
  isMuted: boolean,
) => getNoiseFilterTargetVolume(globalVolume, isMuted) > 0;
