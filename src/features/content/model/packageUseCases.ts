import { adminPackageRepository, type AdminPackageRepository } from '@/server/repositories/adminPackageRepository';
import type { Package } from '@/types/package';

export const loadActivePackages = async (
    deps: Pick<AdminPackageRepository, 'listActivePackages'> = adminPackageRepository
): Promise<Package[]> => {
    return deps.listActivePackages();
};

export const filterPackagesByIncludes = (
    packages: Package[],
    requiredIncludes: string[]
): Package[] => {
    const includeSet = new Set(requiredIncludes.map((value) => value.trim()).filter(Boolean));
    if (includeSet.size === 0) {
        return packages;
    }

    return packages.filter((pkg) =>
        pkg.includes.some((include) => includeSet.has(include.trim()))
    );
};
