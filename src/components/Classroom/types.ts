export interface Announcement {
    id: number;
    title: string;
    content: string;
    created_at: string;
    expires_at?: string;
    priority: 'low' | 'normal' | 'high';
    created_by: string;
    class_id: string;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    assigned_at: string;
    questions: any[];
    status: 'pending' | 'completed';
    score: number | null;
    total_questions?: number;
    answers?: any[];
    duration_minutes?: number;
}

export interface ClassMember {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

export interface ProfileData {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

export interface LeaderboardEntry {
    student_id: string;
    student_name: string;
    avatar_url?: string;
    total_score: number;
    correct_answers: number;
    total_questions: number;
    completion_rate: number;
    rank?: number;
}
