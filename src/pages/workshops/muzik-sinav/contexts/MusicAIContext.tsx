/**
 * MusicAIContext — Central AI brain for the Music Exam Workshop.
 *
 * Provides:
 * - AI content generation (melodies, rhythms, songs, notes)
 * - Real piano sound playback (Tone.js Sampler)
 * - AI performance analysis
 * - Adaptive difficulty management
 */

import React, { type ReactNode } from 'react';
import { MusicAIContext } from './musicAI/musicAIContext';
import { useMusicAIController } from '../hooks/useMusicAIController';

export const MusicAIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const controller = useMusicAIController();

    return (
        <MusicAIContext.Provider value={controller}>
            {children}
        </MusicAIContext.Provider>
    );
};
