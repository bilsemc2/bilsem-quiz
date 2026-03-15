import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createClassAnnouncement,
    updateClassroomSettings
} from '../../../../src/features/content/model/classroomUseCases.ts';

test('createClassAnnouncement trims fields and normalizes optional expiration date', async () => {
    let receivedExpiresAt: string | null = null;
    let receivedTitle = '';
    const expectedExpiresAt = new Date('2026-03-20T10:30').toISOString();

    await createClassAnnouncement(
        {
            classId: 'class-1',
            userId: 'teacher-1',
            title: '  Sinav Hatirlatmasi  ',
            content: '  Yarin deneme var  ',
            priority: 'high',
            expiresAt: '2026-03-20T10:30'
        },
        {
            createAnnouncement: async (input) => {
                receivedTitle = input.title;
                receivedExpiresAt = input.expiresAt;
                assert.equal(input.content, 'Yarin deneme var');
                assert.equal(input.createdBy, 'teacher-1');
            }
        }
    );

    assert.equal(receivedTitle, 'Sinav Hatirlatmasi');
    assert.equal(receivedExpiresAt, expectedExpiresAt);
});

test('updateClassroomSettings trims the classroom name before saving', async () => {
    let receivedName = '';

    await updateClassroomSettings(
        {
            classId: 'class-2',
            name: '  5-A Matematik  ',
            grade: 5
        },
        {
            updateClassroom: async (_classId, input) => {
                receivedName = input.name;
                assert.equal(input.grade, 5);
            }
        }
    );

    assert.equal(receivedName, '5-A Matematik');
});
