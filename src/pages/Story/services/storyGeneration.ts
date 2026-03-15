// Story GPT Service — Story generation

import { StoryTheme } from '../components/types.ts';
import {
    loadSessionAccessToken,
} from '@/features/auth/model/authUseCases';

import {
    getEdgeFunctionUrl,
    annotateQuestionSource,
} from './gptTypes.ts';
import type { GeneratedQuestion } from './gptTypes.ts';

export async function generateStory(theme: StoryTheme) {
    try {
        const accessToken = await loadSessionAccessToken();

        const response = await fetch(getEdgeFunctionUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                action: 'generateStory',
                theme
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Hikaye oluşturulurken bir hata oluştu');
        }

        const data = await response.json();
        const storyData = data.result;

        // Validate the response
        if (!storyData || typeof storyData !== 'object') {
            throw new Error('Geçersiz hikaye verisi');
        }

        if (!storyData.title || !storyData.content || !storyData.summary) {
            throw new Error('Hikaye verilerinde gerekli alanlar eksik');
        }

        // Validate questions
        if (!storyData.questions || !Array.isArray(storyData.questions)) {
            throw new Error('Hikaye sorularında hata');
        }

        // Validate each question format
        for (const question of storyData.questions) {
            if (!question.text || !Array.isArray(question.options) ||
                question.options.length !== 4 || typeof question.correctAnswer !== 'number' ||
                !question.feedback?.correct || !question.feedback?.incorrect) {
                throw new Error('Soru formatı geçersiz');
            }
        }

        const themeImageMap: Record<string, string> = {
            adventure: '/images/story/adventure.png',
            friendship: '/images/story/friendship.png',
            science: '/images/story/science.png',
            animals: '/images/story/animals.png',
            fantasy: '/images/story/adventure.png',
            'life-lessons': '/images/story/friendship.png',
        };

        return {
            ...storyData,
            questions: annotateQuestionSource(storyData.questions as GeneratedQuestion[], 'ai'),
            image_url: themeImageMap[theme] || '/images/story/adventure.png',
            theme
        };
    } catch (error) {
        throw error instanceof Error ? error : new Error('Hikaye oluşturulurken beklenmeyen bir hata oluştu');
    }
}
