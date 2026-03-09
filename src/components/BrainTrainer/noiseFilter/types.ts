import type { SoundItem } from "../noiseFilterData.ts";

export interface NoiseFilterRound {
  targetSound: SoundItem;
  options: SoundItem[];
}
