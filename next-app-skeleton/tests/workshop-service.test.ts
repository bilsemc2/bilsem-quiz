import { describe, expect, it } from 'vitest';

import { getWorkshopDetail, getWorkshopModule, listWorkshops } from '@/server/services/workshop.service';

describe('workshop.service', () => {
  it('returns feature-based workshop list', async () => {
    const workshops = await listWorkshops();

    expect(workshops.length).toBeGreaterThan(0);
    expect(workshops.some((item) => item.id === 'bireysel-degerlendirme')).toBe(true);
  });

  it('returns workshop detail with modules', async () => {
    const detail = await getWorkshopDetail('bireysel-degerlendirme');

    expect(detail).not.toBeNull();
    expect(detail?.modules.length).toBeGreaterThan(0);
  });

  it('returns migrated workshop module detail', async () => {
    const module = await getWorkshopModule('resim-atolyesi', 'resim-gorsel-algi');

    expect(module).not.toBeNull();
    expect(module?.migrated).toBe(true);
    expect(module?.route).toBe('/workshops/resim-atolyesi/modules/resim-gorsel-algi');
  });

  it('returns null for unknown workshop module', async () => {
    const module = await getWorkshopModule('muzik-atolyesi', 'unknown-module');

    expect(module).toBeNull();
  });

  it('returns null for unknown workshop', async () => {
    const detail = await getWorkshopDetail('unknown-workshop');

    expect(detail).toBeNull();
  });
});
