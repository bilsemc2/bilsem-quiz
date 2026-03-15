import { supabase } from '@/lib/supabase';

export interface HomeworkQuizOptionRecord {
    id: string;
    text: string;
    isCorrect: boolean;
    imageUrl?: string;
}

export interface HomeworkQuizQuestionRecord {
    id: string;
    text: string;
    options: HomeworkQuizOptionRecord[];
    questionImageUrl?: string;
    solutionVideo?: {
        videoId: string;
    };
}

export interface HomeworkAssignmentRecord {
    id: string;
    title: string;
    description: string;
    grade: number;
    subject: string;
    questions: HomeworkQuizQuestionRecord[];
    is_active: boolean;
    created_at: string;
}

export interface HomeworkAssignmentPreviewRecord {
    id: string;
    title: string;
    description: string;
    questions: HomeworkQuizQuestionRecord[];
}

export interface HomeworkQuizResultRecord {
    id: string;
    quiz_id: string;
    score: number;
    correct_answers: number;
    questions_answered: number;
    completed_at: string;
}

export interface CreateQuizResultInput {
    user_id: string;
    quiz_id: string;
    score: number;
    questions_answered: number;
    correct_answers: number;
    completed_at: string;
    user_answers: unknown;
    title?: string;
}

export interface CreateAssignmentResultInput {
    assignment_id: string;
    student_id: string;
    answers: unknown;
    score: number;
    total_questions: number;
    completed_at: string;
    status?: string;
    duration_minutes?: number | null;
    duration?: number | null;
}

export interface HomeworkRepository {
    listAssignments: () => Promise<HomeworkAssignmentRecord[]>;
    listQuizResultsByUserId: (userId: string) => Promise<HomeworkQuizResultRecord[]>;
    listAssignmentsByIds: (assignmentIds: string[]) => Promise<HomeworkAssignmentPreviewRecord[]>;
    createQuizResult: (input: CreateQuizResultInput) => Promise<void>;
    createAssignmentResult: (input: CreateAssignmentResultInput) => Promise<void>;
    markAssignmentCompleted: (assignmentId: string) => Promise<void>;
}

const listAssignments = async (): Promise<HomeworkAssignmentRecord[]> => {
    const { data, error } = await supabase
        .from('assignments')
        .select('id, title, description, grade, subject, questions, is_active, created_at');

    if (error || !data) {
        if (error) {
            console.error('assignments fetch failed:', error);
        }
        return [];
    }

    return data as HomeworkAssignmentRecord[];
};

const listQuizResultsByUserId = async (userId: string): Promise<HomeworkQuizResultRecord[]> => {
    const { data, error } = await supabase
        .from('quiz_results')
        .select('id, quiz_id, score, correct_answers, questions_answered, completed_at')
        .eq('user_id', userId);

    if (error || !data) {
        if (error) {
            console.error('quiz results fetch failed:', error);
        }
        return [];
    }

    return data as HomeworkQuizResultRecord[];
};

const listAssignmentsByIds = async (
    assignmentIds: string[]
): Promise<HomeworkAssignmentPreviewRecord[]> => {
    if (assignmentIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('assignments')
        .select('id, title, description, questions')
        .in('id', assignmentIds);

    if (error || !data) {
        if (error) {
            console.error('assignments by ids fetch failed:', error);
        }
        return [];
    }

    return data as HomeworkAssignmentPreviewRecord[];
};

const createQuizResult = async (input: CreateQuizResultInput): Promise<void> => {
    const { error } = await supabase.from('quiz_results').insert(input);

    if (error) {
        throw error;
    }
};

const createAssignmentResult = async (input: CreateAssignmentResultInput): Promise<void> => {
    const payload = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
    );

    const { error } = await supabase.from('assignment_results').insert(payload);

    if (error) {
        throw error;
    }
};

const markAssignmentCompleted = async (assignmentId: string): Promise<void> => {
    const { error } = await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);

    if (error) {
        throw error;
    }
};

export const homeworkRepository: HomeworkRepository = {
    listAssignments,
    listQuizResultsByUserId,
    listAssignmentsByIds,
    createQuizResult,
    createAssignmentResult,
    markAssignmentCompleted
};
