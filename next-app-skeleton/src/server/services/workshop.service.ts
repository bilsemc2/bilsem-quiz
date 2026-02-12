import type { WorkshopDetail, WorkshopModuleSummary, WorkshopSummary } from '@/shared/types/domain';

import { getWorkshopCatalogItem, WORKSHOP_CATALOG } from '@/features/workshops/data/workshop-catalog';

function toWorkshopSummary(workshop: WorkshopDetail): WorkshopSummary {
  const migratedModules = workshop.modules.filter((module) => module.migrated).length;

  return {
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    difficulty: workshop.difficulty,
    audience: workshop.audience,
    moduleCount: workshop.modules.length,
    migrated: migratedModules === workshop.modules.length,
  };
}

export async function listWorkshops(): Promise<WorkshopSummary[]> {
  return WORKSHOP_CATALOG.map(toWorkshopSummary);
}

export async function getWorkshopDetail(workshopId: string): Promise<WorkshopDetail | null> {
  const workshop = getWorkshopCatalogItem(workshopId);

  if (!workshop) {
    return null;
  }

  const migratedModules = workshop.modules.filter((module) => module.migrated).length;

  return {
    ...workshop,
    moduleCount: workshop.modules.length,
    migrated: migratedModules === workshop.modules.length,
  };
}

export async function getWorkshopModule(
  workshopId: string,
  moduleId: string,
): Promise<WorkshopModuleSummary | null> {
  const workshop = await getWorkshopDetail(workshopId);

  if (!workshop) {
    return null;
  }

  return workshop.modules.find((module) => module.id === moduleId) ?? null;
}
