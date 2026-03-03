import type {
    CreateLessonSlotInput,
    UpdateLessonSlotInput
} from '@/server/repositories/adminLessonSlotRepository';

export interface LessonSlotDraftInput {
    title: string;
    student_name: string;
    parent_name: string;
    phone: string;
    hour: number;
    minute: number;
    duration: number;
    color: string;
}

const createSlotId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const buildTutorLessonSlot = (
    day: string,
    data: LessonSlotDraftInput
): CreateLessonSlotInput => {
    return {
        id: createSlotId(),
        day,
        hour: data.hour,
        minute: data.minute,
        duration: data.duration,
        is_booked: true,
        title: data.title,
        student_name: data.student_name,
        parent_name: data.parent_name,
        phone: data.phone,
        color: data.color
    };
};

export const buildStudentReservationSlot = (
    day: string,
    hour: number
): CreateLessonSlotInput => {
    return {
        id: createSlotId(),
        day,
        hour,
        minute: 0,
        duration: 60,
        is_booked: true,
        title: 'Öğrenci Rezervasyonu'
    };
};

export const toLessonSlotUpdateInput = (
    data: LessonSlotDraftInput
): UpdateLessonSlotInput => {
    return {
        title: data.title,
        student_name: data.student_name,
        parent_name: data.parent_name,
        phone: data.phone,
        hour: data.hour,
        minute: data.minute,
        duration: data.duration,
        color: data.color
    };
};
