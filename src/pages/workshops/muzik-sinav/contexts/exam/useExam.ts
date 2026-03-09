import { useContext } from 'react';
import { MusicExamContext } from './examContext';

export function useExam() {
    const context = useContext(MusicExamContext);
    if (!context) {
        throw new Error('useExam must be used within ExamProvider');
    }

    return context;
}
