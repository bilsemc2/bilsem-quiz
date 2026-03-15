import {
    adminLessonSlotRepository,
    type AdminLessonSlotRecord,
    type AdminLessonSlotRepository
} from '@/server/repositories/adminLessonSlotRepository';

export interface PublicLessonSlot {
    id: string;
    day: string;
    hour: number;
    minute: number;
    duration: number;
    is_booked: boolean;
}

export const toPublicLessonSlots = (
    slots: AdminLessonSlotRecord[]
): PublicLessonSlot[] => {
    return slots.map((slot) => ({
        id: slot.id,
        day: slot.day,
        hour: Number(slot.hour) || 0,
        minute: Number(slot.minute) || 0,
        duration: Number(slot.duration) || 0,
        is_booked: Boolean(slot.is_booked)
    }));
};

export const loadPublicLessonSlots = async (
    deps: Pick<AdminLessonSlotRepository, 'listSlots'> = adminLessonSlotRepository
): Promise<PublicLessonSlot[]> => {
    const slots = await deps.listSlots();
    return toPublicLessonSlots(slots);
};
