import { supabase } from '@/lib/supabase';

export interface AdminLessonSlotRecord {
    id: string;
    day: string;
    hour: number;
    minute: number;
    duration: number;
    is_booked: boolean;
    title: string | null;
    student_name: string | null;
    parent_name: string | null;
    phone: string | null;
    color: string | null;
}

export interface CreateLessonSlotInput {
    id: string;
    day: string;
    hour: number;
    minute: number;
    duration: number;
    is_booked: boolean;
    title?: string;
    student_name?: string;
    parent_name?: string;
    phone?: string;
    color?: string;
}

export interface UpdateLessonSlotInput {
    title: string;
    student_name: string;
    parent_name: string;
    phone: string;
    hour: number;
    minute: number;
    duration: number;
    color: string;
}

export interface AdminLessonSlotRepository {
    listSlots: () => Promise<AdminLessonSlotRecord[]>;
    createSlot: (input: CreateLessonSlotInput) => Promise<void>;
    updateSlot: (slotId: string, input: UpdateLessonSlotInput) => Promise<void>;
    deleteSlot: (slotId: string) => Promise<void>;
    deleteAllSlots: () => Promise<void>;
}

const mapLessonSlot = (row: AdminLessonSlotRecord): AdminLessonSlotRecord => {
    return {
        ...row,
        hour: Number(row.hour) || 0,
        minute: Number(row.minute) || 0,
        duration: Number(row.duration) || 60,
        is_booked: Boolean(row.is_booked)
    };
};

const listSlots = async (): Promise<AdminLessonSlotRecord[]> => {
    const { data, error } = await supabase
        .from('lesson_slots')
        .select('*')
        .order('hour', { ascending: true })
        .order('minute', { ascending: true });

    if (error || !data) {
        throw error ?? new Error('Dersler yüklenemedi');
    }

    return (data as AdminLessonSlotRecord[]).map(mapLessonSlot);
};

const createSlot = async (input: CreateLessonSlotInput): Promise<void> => {
    const { error } = await supabase
        .from('lesson_slots')
        .insert(input);

    if (error) {
        throw error;
    }
};

const updateSlot = async (slotId: string, input: UpdateLessonSlotInput): Promise<void> => {
    const { error } = await supabase
        .from('lesson_slots')
        .update(input)
        .eq('id', slotId);

    if (error) {
        throw error;
    }
};

const deleteSlot = async (slotId: string): Promise<void> => {
    const { error } = await supabase
        .from('lesson_slots')
        .delete()
        .eq('id', slotId);

    if (error) {
        throw error;
    }
};

const deleteAllSlots = async (): Promise<void> => {
    const { error } = await supabase
        .from('lesson_slots')
        .delete()
        .gt('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
        throw error;
    }
};

export const adminLessonSlotRepository: AdminLessonSlotRepository = {
    listSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    deleteAllSlots
};
