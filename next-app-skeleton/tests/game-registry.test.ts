import { describe, expect, it } from 'vitest';

import { getRegistryItem } from '@/features/games/game-registry';

describe('game-registry', () => {
  it('marks farki-bul as migrated', () => {
    const item = getRegistryItem('farki-bul');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks kelime-avi as migrated', () => {
    const item = getRegistryItem('kelime-avi');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks attention-coding as migrated', () => {
    const item = getRegistryItem('attention-coding');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks dikkat-ve-kodlama as migrated', () => {
    const item = getRegistryItem('dikkat-ve-kodlama');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks sembol-arama as migrated', () => {
    const item = getRegistryItem('sembol-arama');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks symbol-search as migrated', () => {
    const item = getRegistryItem('symbol-search');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks sekil-hafizasi as migrated', () => {
    const item = getRegistryItem('sekil-hafizasi');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks symbol-match as migrated', () => {
    const item = getRegistryItem('symbol-match');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks gorsel-tarama as migrated', () => {
    const item = getRegistryItem('gorsel-tarama');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks visual-scanning as migrated', () => {
    const item = getRegistryItem('visual-scanning');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks isitsel-hafiza as migrated', () => {
    const item = getRegistryItem('isitsel-hafiza');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks auditory-memory as migrated', () => {
    const item = getRegistryItem('auditory-memory');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks tepki-suresi as migrated', () => {
    const item = getRegistryItem('tepki-suresi');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks reaction-time as migrated', () => {
    const item = getRegistryItem('reaction-time');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks sozel-analoji as migrated', () => {
    const item = getRegistryItem('sozel-analoji');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks verbal-analogy as migrated', () => {
    const item = getRegistryItem('verbal-analogy');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks es-anlam as migrated', () => {
    const item = getRegistryItem('es-anlam');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks synonym as migrated', () => {
    const item = getRegistryItem('synonym');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks sayi-sihirbazi as migrated', () => {
    const item = getRegistryItem('sayi-sihirbazi');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks matematik-grid as migrated', () => {
    const item = getRegistryItem('matematik-grid');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks gorsel-hafiza as migrated', () => {
    const item = getRegistryItem('gorsel-hafiza');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks sayisal-hafiza as migrated', () => {
    const item = getRegistryItem('sayisal-hafiza');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks sayisal-dizi as migrated', () => {
    const item = getRegistryItem('sayisal-dizi');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks number-sequence as migrated', () => {
    const item = getRegistryItem('number-sequence');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks sayisal-sifre as migrated', () => {
    const item = getRegistryItem('sayisal-sifre');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks number-cipher as migrated', () => {
    const item = getRegistryItem('number-cipher');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks n-geri-sifresi as migrated', () => {
    const item = getRegistryItem('n-geri-sifresi');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks n-back as migrated', () => {
    const item = getRegistryItem('n-back');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks kozmik-hafiza as migrated', () => {
    const item = getRegistryItem('kozmik-hafiza');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks lazer-labirent as migrated', () => {
    const item = getRegistryItem('lazer-labirent');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks saat-problemi as migrated', () => {
    const item = getRegistryItem('saat-problemi');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks labirent as migrated', () => {
    const item = getRegistryItem('labirent');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('marks algisal-hiz as migrated', () => {
    const item = getRegistryItem('algisal-hiz');

    expect(item).not.toBeNull();
    expect(item?.migrated).toBe(true);
  });

  it('returns null for unknown game', () => {
    const item = getRegistryItem('unknown-game-id');

    expect(item).toBeNull();
  });
});
