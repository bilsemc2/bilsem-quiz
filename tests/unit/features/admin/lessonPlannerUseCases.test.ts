import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildStudentReservationSlot,
    buildTutorLessonSlot,
    toLessonSlotUpdateInput
} from '../../../../src/features/admin/model/lessonPlannerUseCases.ts';

test('buildTutorLessonSlot creates booked slot with provided metadata', () => {
    const slot = buildTutorLessonSlot('Pazartesi', {
        title: 'Matematik',
        student_name: 'Ali',
        parent_name: 'Ayşe',
        phone: '05550000000',
        hour: 10,
        minute: 30,
        duration: 60,
        color: 'blue'
    });

    assert.equal(slot.day, 'Pazartesi');
    assert.equal(slot.is_booked, true);
    assert.equal(slot.title, 'Matematik');
    assert.equal(typeof slot.id, 'string');
});

test('buildStudentReservationSlot creates default reservation payload', () => {
    const slot = buildStudentReservationSlot('Salı', 14);

    assert.equal(slot.day, 'Salı');
    assert.equal(slot.hour, 14);
    assert.equal(slot.minute, 0);
    assert.equal(slot.duration, 60);
    assert.equal(slot.title, 'Öğrenci Rezervasyonu');
});

test('toLessonSlotUpdateInput maps editable fields as-is', () => {
    const payload = toLessonSlotUpdateInput({
        title: 'Fen',
        student_name: 'Can',
        parent_name: 'Zeynep',
        phone: '0555',
        hour: 9,
        minute: 15,
        duration: 45,
        color: 'green'
    });

    assert.equal(payload.title, 'Fen');
    assert.equal(payload.hour, 9);
    assert.equal(payload.minute, 15);
    assert.equal(payload.duration, 45);
    assert.equal(payload.color, 'green');
});
