export enum ActivityMode {
    THREE_WORDS = 'THREE_WORDS',
    STORY_CONTINUATION = 'STORY_CONTINUATION',
    STILL_LIFE = 'STILL_LIFE'
}

export interface ActivityState {
    mode: ActivityMode;
    status: 'IDLE' | 'GENERATING' | 'DRAWING' | 'ANALYZING' | 'FINISHED';
    promptData?: {
        words?: string[];
        story?: string;
        imageUrl?: string;
    };
    startTime?: number;
    uploadedImage?: string;
    feedback?: string;
    error?: string;
}

export interface AnalysisResponse {
    feedback: string;
    creativityScore: number;
    details: string[];
}
