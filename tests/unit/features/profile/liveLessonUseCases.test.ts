import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadPublicLessonSlots,
    toPublicLessonSlots
} from '../../../../src/features/profile/model/liveLessonUseCases.ts';

test('toPublicLessonSlots strips admin-only fields and normalizes numeric values', () => {
    const slots = toPublicLessonSlots([
        {
            id: 'slot-1',
            day: 'Pazartesi',
            hour: 10,
            minute: 30,
            duration: 60,
            is_booked: false,
            title: 'Gizli',
            student_name: 'Ada',
            parent_name: 'Lovelace',
            phone: '555',
            color: '#fff'
        }
    ]);

    assert.deepEqual(slots, [
        {
            id: 'slot-1',
            day: 'Pazartesi',
            hour: 10,
            minute: 30,
            duration: 60,
            is_booked: false
        }
    ]);
});

test('loadPublicLessonSlots delegates to the repository', async () => {
    const slots = await loadPublicLessonSlots({
        listSlots: async () => [
            {
                id: 'slot-2',
                day: 'Sali',
                hour: 11,
                minute: 0,
                duration: 45,
                is_booked: true,
                title: null,
                student_name: null,
                parent_name: null,
                phone: null,
                color: null
            }
        ]
    });

    assert.equal(slots.length, 1);
    assert.equal(slots[0].hour, 11);
    assert.equal(slots[0].is_booked, true);
});
