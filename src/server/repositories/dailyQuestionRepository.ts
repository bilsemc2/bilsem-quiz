import { supabase } from '@/lib/supabase';

export interface DailyQuestionRecord {
    id: string;
    text: string;
    question_number: number;
    correct_option_id: string;
    image_url?: string;
    solution_video?: string | null;
    is_active: boolean;
}

export interface DailyQuestionRepository {
    listActiveQuestions: () => Promise<DailyQuestionRecord[]>;
}

const listActiveQuestions = async (): Promise<DailyQuestionRecord[]> => {
    const { data, error } = await supabase
        .from('questions')
        .select('id, text, question_number, correct_option_id, image_url, solution_video, is_active')
        .eq('is_active', true)
        .order('question_number', { ascending: true });

    if (error || !data) {
        if (error) {
            console.error('active questions fetch failed:', error);
        }
        return [];
    }

    return data as DailyQuestionRecord[];
};

export const dailyQuestionRepository: DailyQuestionRepository = {
    listActiveQuestions
};
