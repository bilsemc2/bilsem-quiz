import { supabase } from "../../../lib/supabase";
import { ActivityMode } from "./types";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`;

async function callGeminiProxy(action: string, data: Record<string, unknown> = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action, ...data }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API çağrısı başarısız');
    }

    const result = await response.json();
    return result.result;
}

export async function generateActivityPrompt(mode: ActivityMode) {
    const modeString = mode === ActivityMode.THREE_WORDS ? 'THREE_WORDS' : 'STORY_CONTINUATION';
    return await callGeminiProxy('generatePrompt', { mode: modeString });
}

export async function generateStillLifeImage() {
    // AI ile siyah-beyaz natürmort görseli üret
    return await callGeminiProxy('generateStillLifeImage');
}

export async function analyzeDrawing(mode: ActivityMode, promptData: unknown, drawingBase64: string) {
    const modeString = mode === ActivityMode.THREE_WORDS
        ? 'THREE_WORDS'
        : mode === ActivityMode.STORY_CONTINUATION
            ? 'STORY_CONTINUATION'
            : 'STILL_LIFE';

    return await callGeminiProxy('analyzeDrawing', {
        mode: modeString,
        promptData,
        drawingBase64,
    });
}
