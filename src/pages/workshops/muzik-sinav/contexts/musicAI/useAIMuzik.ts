import { useContext } from 'react';
import { MusicAIContext } from './musicAIContext';

export function useAIMuzik() {
    const context = useContext(MusicAIContext);
    if (!context) {
        throw new Error('useAIMuzik must be used within MusicAIProvider');
    }

    return context;
}
