import assert from 'node:assert/strict';
import test from 'node:test';
import {
    approvePuzzle,
    fixProfessionImages,
    fixProfessionImagesInGrid,
    getUserPuzzles,
    savePuzzle,
    type PuzzleGrid
} from '../../../../src/features/content/model/puzzleUseCases.ts';

const createProfessionCell = (id: string, src: string) => ({
    type: 'profession',
    id,
    svg: {
        props: {
            children: {
                props: {
                    src
                }
            }
        }
    }
});

test('savePuzzle injects the current user and keeps the puzzle pending approval', async () => {
    let receivedInput: {
        title?: string;
        createdBy: string;
        approved: boolean;
    } | null = null;

    const result = await savePuzzle(
        {
            title: 'Meslek Bulmacasi',
            grid: [[createProfessionCell('construction', '/images/professions/unknown.png')]]
        },
        {
            auth: {
                getSessionUser: async () => ({ id: 'user-1' } as { id: string })
            },
            puzzles: {
                createPuzzle: async (input) => {
                    receivedInput = input;
                    return [{
                        id: 'puzzle-1',
                        title: input.title || '',
                        grid: input.grid || [],
                        created_at: '2026-03-13T10:00:00.000Z',
                        created_by: input.createdBy,
                        approved: input.approved
                    }];
                }
            }
        }
    );

    assert.equal(receivedInput?.createdBy, 'user-1');
    assert.equal(receivedInput?.approved, false);
    assert.equal(result[0].approved, false);
});

test('getUserPuzzles returns an empty list when there is no signed-in user', async () => {
    const puzzles = await getUserPuzzles({
        auth: {
            getSessionUser: async () => null
        },
        puzzles: {
            listPuzzlesByCreator: async () => {
                throw new Error('should not run');
            }
        }
    });

    assert.deepEqual(puzzles, []);
});

test('approvePuzzle rejects non-admin users before touching the repository', async () => {
    let updateCalled = false;

    await assert.rejects(
        () => approvePuzzle('puzzle-9', {
            auth: {
                getSessionUser: async () => ({ id: 'user-9' } as { id: string }),
                getProfileByUserId: async () => ({
                    id: 'user-9',
                    email: 'user@example.com',
                    name: 'User',
                    experience: 10,
                    is_admin: false
                })
            },
            puzzles: {
                updatePuzzleApproval: async () => {
                    updateCalled = true;
                }
            }
        }),
        /Admin yetkisi gerekli/
    );

    assert.equal(updateCalled, false);
});

test('fixProfessionImagesInGrid repairs only unknown profession placeholders', () => {
    const grid: PuzzleGrid = [[
        createProfessionCell('construction', '/images/professions/unknown.png'),
        createProfessionCell('astronaut', '/images/professions/unknown.png'),
        createProfessionCell('teacher', '/images/professions/teacher.png'),
        null
    ]];

    const { grid: nextGrid, updated } = fixProfessionImagesInGrid(grid);

    assert.equal(updated, true);
    assert.equal(nextGrid[0][0]?.svg?.props?.children?.props?.src, '/images/professions/construction.png');
    assert.equal(nextGrid[0][1]?.svg?.props?.children?.props?.src, '/images/professions/astronaut.png');
    assert.equal(nextGrid[0][2]?.svg?.props?.children?.props?.src, '/images/professions/teacher.png');
    assert.equal(nextGrid[0][3], null);
});

test('fixProfessionImages updates only grids that actually change', async () => {
    const updatedPuzzleIds: string[] = [];

    const result = await fixProfessionImages({
        auth: {
            getSessionUser: async () => ({ id: 'admin-1' } as { id: string }),
            getProfileByUserId: async () => ({
                id: 'admin-1',
                email: 'admin@example.com',
                name: 'Admin',
                experience: 0,
                is_admin: true
            })
        },
        puzzles: {
            listPuzzleGrids: async () => [
                {
                    id: 'puzzle-a',
                    grid: [[createProfessionCell('construction', '/images/professions/unknown.png')]]
                },
                {
                    id: 'puzzle-b',
                    grid: [[createProfessionCell('teacher', '/images/professions/teacher.png')]]
                }
            ],
            updatePuzzleGrid: async (id, grid) => {
                updatedPuzzleIds.push(id);
                assert.equal(grid[0][0]?.svg?.props?.children?.props?.src, '/images/professions/construction.png');
            }
        }
    });

    assert.deepEqual(updatedPuzzleIds, ['puzzle-a']);
    assert.deepEqual(result, { success: true });
});
