import { authRepository, type AuthRepository } from '@/server/repositories/authRepository';
import {
    puzzleRepository,
    type GridCell,
    type PuzzleData,
    type PuzzleGrid,
    type PuzzleRepository
} from '@/server/repositories/puzzleRepository';

export type { GridCell, PuzzleData, PuzzleGrid } from '@/server/repositories/puzzleRepository';

const ADMIN_REQUIRED_MESSAGE = 'Admin yetkisi gerekli';

const requireSignedInUser = async (
    deps: Pick<AuthRepository, 'getSessionUser'>,
    message: string
) => {
    const user = await deps.getSessionUser();
    if (!user) {
        throw new Error(message);
    }

    return user;
};

const requireAdminUser = async (
    deps: Pick<AuthRepository, 'getSessionUser' | 'getProfileByUserId'>
) => {
    const user = await requireSignedInUser(deps, ADMIN_REQUIRED_MESSAGE);
    const profile = await deps.getProfileByUserId(user.id);

    if (!profile?.is_admin) {
        throw new Error(ADMIN_REQUIRED_MESSAGE);
    }

    return user;
};

const updateProfessionCellImage = (
    cell: GridCell | null,
    professionId: string,
    nextImageSrc: string
): { cell: GridCell | null; updated: boolean } => {
    if (!cell || cell.type !== 'profession' || cell.id !== professionId) {
        return { cell, updated: false };
    }

    const svgProps = cell.svg?.props;
    const childProps = svgProps?.children?.props;

    if (childProps?.src !== '/images/professions/unknown.png') {
        return { cell, updated: false };
    }

    return {
        updated: true,
        cell: {
            ...cell,
            svg: {
                ...cell.svg,
                props: {
                    ...svgProps,
                    children: {
                        ...svgProps?.children,
                        props: {
                            ...childProps,
                            src: nextImageSrc
                        }
                    }
                }
            }
        }
    };
};

export const fixProfessionImagesInGrid = (
    grid: PuzzleGrid
): { grid: PuzzleGrid; updated: boolean } => {
    let updated = false;

    const nextGrid = grid.map((row) =>
        row.map((cell) => {
            const constructionUpdate = updateProfessionCellImage(
                cell,
                'construction',
                '/images/professions/construction.png'
            );

            if (constructionUpdate.updated) {
                updated = true;
                return constructionUpdate.cell;
            }

            const astronautUpdate = updateProfessionCellImage(
                cell,
                'astronaut',
                '/images/professions/astronaut.png'
            );

            if (astronautUpdate.updated) {
                updated = true;
                return astronautUpdate.cell;
            }

            return cell;
        })
    );

    return { grid: nextGrid, updated };
};

export const savePuzzle = async (
    puzzleData: Partial<PuzzleData>,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser'>;
        puzzles: Pick<PuzzleRepository, 'createPuzzle'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<PuzzleData[]> => {
    const user = await requireSignedInUser(deps.auth, 'Kullanici kimligi dogrulanamadi');

    return deps.puzzles.createPuzzle({
        grid: puzzleData.grid,
        title: puzzleData.title,
        createdBy: user.id,
        approved: false
    });
};

export const getRecentPuzzles = async (
    deps: Pick<PuzzleRepository, 'listRecentApprovedPuzzles'> = puzzleRepository
): Promise<PuzzleData[]> => deps.listRecentApprovedPuzzles();

export const subscribeToNewPuzzles = (
    callback: (puzzle: PuzzleData) => void,
    deps: Pick<PuzzleRepository, 'subscribeToPuzzleInserts'> = puzzleRepository
) => deps.subscribeToPuzzleInserts(callback);

export const getPuzzles = async (
    deps: Pick<PuzzleRepository, 'listApprovedPuzzles'> = puzzleRepository
): Promise<PuzzleData[]> => deps.listApprovedPuzzles();

export const getAllPuzzles = async (
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser' | 'getProfileByUserId'>;
        puzzles: Pick<PuzzleRepository, 'listAllPuzzles'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<PuzzleData[]> => {
    await requireAdminUser(deps.auth);
    return deps.puzzles.listAllPuzzles();
};

export const getUserPuzzles = async (
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser'>;
        puzzles: Pick<PuzzleRepository, 'listPuzzlesByCreator'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<PuzzleData[]> => {
    const user = await deps.auth.getSessionUser();
    if (!user) {
        return [];
    }

    return deps.puzzles.listPuzzlesByCreator(user.id);
};

export const getPuzzleById = async (
    id: string,
    deps: Pick<PuzzleRepository, 'getPuzzleById'> = puzzleRepository
): Promise<PuzzleData> => deps.getPuzzleById(id);

export const updatePuzzle = async (
    id: string,
    puzzleData: Partial<PuzzleData>,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser'>;
        puzzles: Pick<PuzzleRepository, 'updatePuzzleByOwner'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<PuzzleData | null> => {
    const user = await requireSignedInUser(deps.auth, 'Bulmaca guncellemek icin giris yapmalisiniz');
    return deps.puzzles.updatePuzzleByOwner(id, user.id, puzzleData);
};

export const approvePuzzle = async (
    id: string,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser' | 'getProfileByUserId'>;
        puzzles: Pick<PuzzleRepository, 'updatePuzzleApproval'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<void> => {
    await requireAdminUser(deps.auth);
    await deps.puzzles.updatePuzzleApproval(id, true);
};

export const rejectPuzzle = async (
    id: string,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser' | 'getProfileByUserId'>;
        puzzles: Pick<PuzzleRepository, 'deletePuzzleById'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<void> => {
    await requireAdminUser(deps.auth);
    await deps.puzzles.deletePuzzleById(id);
};

export const deletePuzzle = async (
    id: string,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser'>;
        puzzles: Pick<PuzzleRepository, 'deletePuzzleByOwner'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<boolean> => {
    const user = await requireSignedInUser(deps.auth, 'Bulmaca silmek icin giris yapmalisiniz');
    await deps.puzzles.deletePuzzleByOwner(id, user.id);
    return true;
};

export const togglePuzzleStatus = async (
    id: string,
    currentStatus: boolean,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser' | 'getProfileByUserId'>;
        puzzles: Pick<PuzzleRepository, 'updatePuzzleApproval'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<void> => {
    await requireAdminUser(deps.auth);
    await deps.puzzles.updatePuzzleApproval(id, !currentStatus);
};

export const deletePuzzleByAdmin = async (
    id: string,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser' | 'getProfileByUserId'>;
        puzzles: Pick<PuzzleRepository, 'deletePuzzleById'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<void> => {
    await requireAdminUser(deps.auth);
    await deps.puzzles.deletePuzzleById(id);
};

export const fixProfessionImages = async (
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser' | 'getProfileByUserId'>;
        puzzles: Pick<PuzzleRepository, 'listPuzzleGrids' | 'updatePuzzleGrid'>;
    } = { auth: authRepository, puzzles: puzzleRepository }
): Promise<{ success: true }> => {
    await requireAdminUser(deps.auth);
    const puzzles = await deps.puzzles.listPuzzleGrids();

    for (const puzzle of puzzles) {
        const { grid, updated } = fixProfessionImagesInGrid(puzzle.grid);

        if (updated) {
            await deps.puzzles.updatePuzzleGrid(puzzle.id, grid);
        }
    }

    return { success: true };
};
