
import { ARCADE_PALETTE } from '../../Shared/ArcadeConstants';

// Renkler artık ARCADE_PALETTE'den türetiliyor (Candy-Pastel standart)
export const COLORS = Object.values(ARCADE_PALETTE).map(c => ({
  name: c.name,
  hex: c.hex
}));

export const GRID_SIZE = 6;
export const MEMORIZE_TIME_BASE = 3000; // ms
