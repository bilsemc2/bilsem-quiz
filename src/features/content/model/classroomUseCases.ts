import {
    classroomRepository,
    type AnnouncementPriority,
    type ClassroomRepository
} from '@/server/repositories/classroomRepository';

export interface CreateClassAnnouncementInput {
    classId: string;
    userId: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    expiresAt: string;
}

export interface UpdateClassroomSettingsInput {
    classId: string;
    name: string;
    grade: number;
}

const normalizeOptionalDateTime = (value: string): string | null => {
    const normalized = value.trim();
    return normalized ? new Date(normalized).toISOString() : null;
};

export const createClassAnnouncement = async (
    input: CreateClassAnnouncementInput,
    deps: Pick<ClassroomRepository, 'createAnnouncement'> = classroomRepository
): Promise<void> => {
    await deps.createAnnouncement({
        classId: input.classId,
        title: input.title.trim(),
        content: input.content.trim(),
        priority: input.priority,
        expiresAt: normalizeOptionalDateTime(input.expiresAt),
        createdBy: input.userId
    });
};

export const updateClassroomSettings = async (
    input: UpdateClassroomSettingsInput,
    deps: Pick<ClassroomRepository, 'updateClassroom'> = classroomRepository
): Promise<void> => {
    await deps.updateClassroom(input.classId, {
        name: input.name.trim(),
        grade: input.grade
    });
};
