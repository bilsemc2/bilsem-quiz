import { supabase } from '@/lib/supabase';

export type AnnouncementPriority = 'low' | 'normal' | 'high';

export interface CreateAnnouncementInput {
    classId: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    expiresAt: string | null;
    createdBy: string;
}

export interface UpdateClassroomInput {
    name: string;
    grade: number;
}

export interface ClassroomRepository {
    createAnnouncement: (input: CreateAnnouncementInput) => Promise<void>;
    updateClassroom: (classId: string, input: UpdateClassroomInput) => Promise<void>;
}

const createAnnouncement = async (input: CreateAnnouncementInput): Promise<void> => {
    const { error } = await supabase
        .from('announcements')
        .insert([
            {
                class_id: input.classId,
                title: input.title,
                content: input.content,
                priority: input.priority,
                expires_at: input.expiresAt,
                created_by: input.createdBy
            }
        ]);

    if (error) {
        throw error;
    }
};

const updateClassroom = async (classId: string, input: UpdateClassroomInput): Promise<void> => {
    const { error } = await supabase
        .from('classes')
        .update({
            name: input.name,
            grade: input.grade
        })
        .eq('id', classId);

    if (error) {
        throw error;
    }
};

export const classroomRepository: ClassroomRepository = {
    createAnnouncement,
    updateClassroom
};
