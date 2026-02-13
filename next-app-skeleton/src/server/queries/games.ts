import type { GameCategory, GameSummary } from '@/shared/types/domain';

interface GameCatalogItem {
  title: string;
  category: GameCategory;
  durationSeconds: number;
}

export const GAME_CATALOG: Record<string, GameCatalogItem> = {
  'attention-coding': {
    title: 'Attention Coding',
    category: 'attention',
    durationSeconds: 120,
  },
  'word-hunt': {
    title: 'Word Hunt',
    category: 'language',
    durationSeconds: 150,
  },
  'spot-difference': {
    title: 'Spot Difference',
    category: 'attention',
    durationSeconds: 180,
  },
  'farki-bul': {
    title: 'Farki Bul',
    category: 'attention',
    durationSeconds: 180,
  },
  'kelime-avi': {
    title: 'Kelime Avi',
    category: 'language',
    durationSeconds: 150,
  },
  'sembol-arama': {
    title: 'Sembol Arama',
    category: 'attention',
    durationSeconds: 180,
  },
  'sekil-hafizasi': {
    title: 'Sekil Hafizasi',
    category: 'memory',
    durationSeconds: 180,
  },
  'gorsel-tarama': {
    title: 'Gorsel Tarama',
    category: 'attention',
    durationSeconds: 180,
  },
  'isitsel-hafiza': {
    title: 'Isitsel Hafiza',
    category: 'memory',
    durationSeconds: 180,
  },
  'tepki-suresi': {
    title: 'Tepki Suresi',
    category: 'attention',
    durationSeconds: 180,
  },
  'sozel-analoji': {
    title: 'Sozel Analoji',
    category: 'language',
    durationSeconds: 180,
  },
  'es-anlam': {
    title: 'Es Anlam',
    category: 'language',
    durationSeconds: 180,
  },
  'cumle-ici-es-anlam': {
    title: 'Cumle Ici Es Anlam',
    category: 'language',
    durationSeconds: 180,
  },
  'simge-kodlama': {
    title: 'Simge Kodlama',
    category: 'attention',
    durationSeconds: 120,
  },
  'kosullu-yonerge': {
    title: 'Kosullu Yonerge',
    category: 'logic',
    durationSeconds: 180,
  },
  'mantik-bulmacasi': {
    title: 'Mantik Bulmacasi',
    category: 'logic',
    durationSeconds: 180,
  },
  'sayi-sihirbazi': {
    title: 'Sayi Sihirbazi',
    category: 'logic',
    durationSeconds: 180,
  },
  'matematik-grid': {
    title: 'Matematik Grid',
    category: 'logic',
    durationSeconds: 180,
  },
  'gorsel-hafiza': {
    title: 'Gorsel Hafiza',
    category: 'memory',
    durationSeconds: 180,
  },
  'sayisal-hafiza': {
    title: 'Sayisal Hafiza',
    category: 'memory',
    durationSeconds: 180,
  },
  'sayisal-dizi': {
    title: 'Sayisal Dizi',
    category: 'logic',
    durationSeconds: 180,
  },
  'sayisal-sifre': {
    title: 'Sayisal Sifre',
    category: 'logic',
    durationSeconds: 180,
  },
  'n-geri-sifresi': {
    title: 'N-Geri Sifresi',
    category: 'memory',
    durationSeconds: 180,
  },
  'kozmik-hafiza': {
    title: 'Kozmik Hafiza',
    category: 'memory',
    durationSeconds: 180,
  },
  'lazer-labirent': {
    title: 'Lazer Labirent',
    category: 'logic',
    durationSeconds: 180,
  },
  'saat-problemi': {
    title: 'Saat Problemi',
    category: 'logic',
    durationSeconds: 180,
  },
  'labirent': {
    title: 'Labirent',
    category: 'logic',
    durationSeconds: 180,
  },
  'algisal-hiz': {
    title: 'Algisal Hiz',
    category: 'attention',
    durationSeconds: 180,
  },
};

export const GAME_SEED: GameSummary[] = Object.entries(GAME_CATALOG).map(([id, item]) => ({
  id,
  title: item.title,
  category: item.category,
  durationSeconds: item.durationSeconds,
}));

export function getCatalogItem(gameId: string): GameCatalogItem | null {
  return GAME_CATALOG[gameId] ?? null;
}

export function toGameTitle(gameId: string): string {
  return gameId
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
