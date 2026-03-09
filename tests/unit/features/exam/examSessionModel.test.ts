import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildCompletedExamPersistenceInput,
    clearExamSessionFromStorage,
    createExamSession,
    getCurrentExamModule,
    getDifficultyConfigForLevel,
    getExamProgress,
    getNextExamLevel,
    markExamSessionCompleted,
    normalizeExamSession,
    readExamSessionFromStorage,
    submitExamModuleResult,
    summarizeExamSession,
    writeExamSessionToStorage
} from '../../../../src/features/exam/model/examSessionModel.ts';
import type { ExamModule, ExamSession } from '../../../../src/types/examTypes.ts';

const modules: ExamModule[] = [
    {
        id: 'module-1',
        title: 'İlk Modül',
        link: '/games/ilk-modul',
        tuzo: '5.1.1',
        category: 'memory',
        timeLimit: 90,
        active: true
    },
    {
        id: 'module-2',
        title: 'İkinci Modül',
        link: '/games/ikinci-modul',
        tuzo: '5.1.2',
        category: 'logic',
        timeLimit: 120,
        active: true
    }
];

const createStorageMock = () => {
    const store = new Map<string, string>();

    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, value);
        },
        removeItem: (key: string) => {
            store.delete(key);
        }
    };
};

test('normalizeExamSession restores ISO date strings into Date objects', () => {
    const session = normalizeExamSession({
        id: 'session-1',
        userId: 'user-1',
        startedAt: '2026-03-07T10:00:00.000Z',
        completedAt: '2026-03-07T10:15:00.000Z',
        modules,
        currentIndex: 1,
        currentLevel: 2,
        results: [],
        status: 'completed',
        examMode: 'standard'
    });

    assert.ok(session);
    assert.ok(session.startedAt instanceof Date);
    assert.ok(session.completedAt instanceof Date);
});

test('storage helpers persist, restore and clear exam sessions', () => {
    const storage = createStorageMock();
    const session = createExamSession({
        id: 'session-1',
        userId: 'user-1',
        mode: 'quick',
        modules,
        startedAt: new Date('2026-03-07T10:00:00.000Z')
    });

    writeExamSessionToStorage(storage, session);
    const restored = readExamSessionFromStorage(storage);

    assert.ok(restored);
    assert.equal(restored.id, session.id);
    assert.ok(restored.startedAt instanceof Date);

    clearExamSessionFromStorage(storage);
    assert.equal(readExamSessionFromStorage(storage), null);
});

test('submitExamModuleResult advances index, appends result and updates level', () => {
    const session = createExamSession({
        id: 'session-1',
        userId: 'user-1',
        mode: 'standard',
        modules,
        startedAt: new Date('2026-03-07T10:00:00.000Z')
    });

    const updated = submitExamModuleResult(session, {
        passed: true,
        score: 80,
        maxScore: 100,
        duration: 95
    });

    assert.equal(updated.currentIndex, 1);
    assert.equal(updated.currentLevel, 2);
    assert.equal(updated.status, 'active');
    assert.equal(updated.results.length, 1);
    assert.equal(updated.results[0].moduleId, 'module-1');
});

test('submitExamModuleResult completes session on final module and clamps failure level', () => {
    const session = {
        ...createExamSession({
            id: 'session-1',
            userId: 'user-1',
            mode: 'standard',
            modules,
            startedAt: new Date('2026-03-07T10:00:00.000Z')
        }),
        currentIndex: 1,
        currentLevel: 1,
        results: [
            {
                moduleId: 'module-1',
                moduleTitle: 'İlk Modül',
                level: 1,
                passed: true,
                score: 80,
                maxScore: 100,
                duration: 95,
                category: 'memory'
            }
        ]
    } satisfies ExamSession;

    const completedAt = new Date('2026-03-07T10:10:00.000Z');
    const updated = submitExamModuleResult(session, {
        passed: false,
        score: 20,
        maxScore: 100,
        duration: 130,
        completedAt
    });

    assert.equal(updated.currentIndex, 2);
    assert.equal(updated.currentLevel, 1);
    assert.equal(updated.status, 'completed');
    assert.equal(updated.completedAt?.toISOString(), completedAt.toISOString());
});

test('progress and module helpers clamp completed sessions correctly', () => {
    const session = {
        ...createExamSession({
            id: 'session-1',
            userId: 'user-1',
            mode: 'quick',
            modules
        }),
        currentIndex: 2,
        currentLevel: 3,
        status: 'completed' as const
    };

    assert.equal(getCurrentExamModule(session), null);
    assert.equal(getNextExamLevel(session), 3);
    assert.deepEqual(getExamProgress(session), {
        current: 2,
        total: 2,
        percentage: 100
    });
});

test('getDifficultyConfigForLevel falls back to medium band for unknown levels', () => {
    assert.equal(getDifficultyConfigForLevel(99).level, 3);
});

test('summarizeExamSession calculates score, BZP and category breakdown', () => {
    const summary = summarizeExamSession({
        results: [
            {
                moduleId: 'module-1',
                moduleTitle: 'İlk Modül',
                level: 2,
                passed: true,
                score: 80,
                maxScore: 100,
                duration: 90,
                category: 'memory'
            },
            {
                moduleId: 'module-2',
                moduleTitle: 'İkinci Modül',
                level: 4,
                passed: false,
                score: 40,
                maxScore: 100,
                duration: 120,
                category: 'logic'
            }
        ]
    });

    assert.equal(summary.passedCount, 1);
    assert.equal(summary.failedCount, 1);
    assert.equal(summary.totalScore, 120);
    assert.equal(summary.maxScore, 200);
    assert.equal(summary.scorePercentage, 60);
    assert.equal(summary.totalDuration, 210);
    assert.equal(summary.categoryStats.memory.percentage, 100);
    assert.equal(summary.categoryStats.logic.percentage, 0);
    assert.equal(summary.bzpScore, 104);
});

test('buildCompletedExamPersistenceInput uses normalized summary values', () => {
    const session = markExamSessionCompleted({
        ...createExamSession({
            id: 'session-1',
            userId: 'anonymous',
            mode: 'standard',
            modules,
            startedAt: new Date('2026-03-07T10:00:00.000Z')
        }),
        results: [
            {
                moduleId: 'module-1',
                moduleTitle: 'İlk Modül',
                level: 3,
                passed: true,
                score: 75,
                maxScore: 100,
                duration: 100,
                category: 'memory'
            }
        ]
    }, new Date('2026-03-07T10:05:00.000Z'));

    const payload = buildCompletedExamPersistenceInput(session, 'user-42');

    assert.equal(payload.userId, 'user-42');
    assert.equal(payload.moduleCount, 2);
    assert.equal(payload.finalScore, 75);
    assert.equal(payload.bzpScore, 115);
    assert.equal(payload.abilityEstimate, '3.00');
});
