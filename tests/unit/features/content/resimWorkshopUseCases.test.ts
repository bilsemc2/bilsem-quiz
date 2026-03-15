import assert from 'node:assert/strict';
import test from 'node:test';
import {
    EMPTY_RESIM_WORKSHOP_ACCESS_STATE,
    TEACHER_RESIM_ANALYSIS_QUOTA,
    consumeResimAnalysisQuota,
    getNextResimAnalysisQuota,
    loadResimWorkshopAccess,
    mapResimWorkshopAccessState
} from '../../../../src/features/content/model/resimWorkshopUseCases.ts';

test('loadResimWorkshopAccess returns the empty state when user is missing', async () => {
    const state = await loadResimWorkshopAccess(null, {
        getResimWorkshopProfile: async () => {
            throw new Error('should not run');
        }
    });

    assert.deepEqual(state, EMPTY_RESIM_WORKSHOP_ACCESS_STATE);
});

test('mapResimWorkshopAccessState grants teachers unlimited quota', () => {
    const state = mapResimWorkshopAccessState({
        yetenek_alani: null,
        role: 'teacher',
        is_admin: false,
        resim_analiz_hakki: 1
    });

    assert.equal(state.hasTalentAccess, true);
    assert.equal(state.isTeacher, true);
    assert.equal(state.analysisQuota, TEACHER_RESIM_ANALYSIS_QUOTA);
});

test('mapResimWorkshopAccessState normalizes talents and quota for standard users', () => {
    const state = mapResimWorkshopAccessState({
        yetenek_alani: 'muzik, resim ; drama',
        role: 'student',
        is_admin: false,
        resim_analiz_hakki: null
    });

    assert.equal(state.hasTalentAccess, true);
    assert.deepEqual(state.userTalents, ['muzik', 'resim', 'drama']);
    assert.equal(state.analysisQuota, 3);
    assert.equal(state.isTeacher, false);
});

test('getNextResimAnalysisQuota never drops below zero', () => {
    assert.equal(getNextResimAnalysisQuota(3), 2);
    assert.equal(getNextResimAnalysisQuota(0), 0);
});

test('consumeResimAnalysisQuota updates the stored quota for the current user', async () => {
    let updatedUserId = '';
    let updatedQuota = -1;

    const nextQuota = await consumeResimAnalysisQuota(
        {
            currentQuota: 2,
            isTeacher: false
        },
        {
            auth: {
                getSessionUser: async () => ({ id: 'user-1' } as { id: string })
            },
            profile: {
                updateResimAnalysisQuota: async (userId, newQuota) => {
                    updatedUserId = userId;
                    updatedQuota = newQuota;
                }
            }
        }
    );

    assert.equal(nextQuota, 1);
    assert.equal(updatedUserId, 'user-1');
    assert.equal(updatedQuota, 1);
});

test('consumeResimAnalysisQuota keeps unlimited quota for teachers', async () => {
    const nextQuota = await consumeResimAnalysisQuota(
        {
            currentQuota: 999,
            isTeacher: true
        },
        {
            auth: {
                getSessionUser: async () => {
                    throw new Error('should not run');
                }
            },
            profile: {
                updateResimAnalysisQuota: async () => {
                    throw new Error('should not run');
                }
            }
        }
    );

    assert.equal(nextQuota, TEACHER_RESIM_ANALYSIS_QUOTA);
});
