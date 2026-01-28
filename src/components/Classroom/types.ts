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

export interface AssignmentQuestion {
    id: string;
    text: string;
    options: string[];
    correct_answer: string;
    image_url?: string;
}

export interface AssignmentAnswerOption {
    id: string;
    imageUrl: string;
    isSelected?: boolean;
    isCorrect?: boolean;
}

export interface AssignmentAnswer {
    question_id: string;
    selected_answer: string;
    is_correct: boolean;
    // Extended properties used in AssignmentResultsModal
    isCorrect?: boolean;           // camelCase alias for is_correct
    questionImage?: string;        // URL of the question image
    isTimeout?: boolean;           // Whether answer was timeout
    options?: AssignmentAnswerOption[]; // Answer options with images
    explanation?: string;          // Explanation for the answer
    videoEmbedCode?: string;       // Video solution embed code
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    assigned_at: string;
    questions: AssignmentQuestion[];
    status: 'pending' | 'completed';
    score: number | null;
    total_questions?: number;
    answers?: AssignmentAnswer[];
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
