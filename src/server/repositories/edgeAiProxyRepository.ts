export interface EdgeAiProxyPayload {
    action: string;
    [key: string]: unknown;
}

export interface EdgeAiProxyResponse {
    result?: unknown;
    error?: string;
    retryAfterSec?: number;
    [key: string]: unknown;
}

export interface EdgeAiProxyRepository {
    invokeGeminiProxy: (
        payload: EdgeAiProxyPayload,
        accessToken?: string | null
    ) => Promise<EdgeAiProxyResponse>;
}

const getEdgeFunctionUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/gemini-proxy`;
};

const readJsonSafely = async (response: Response): Promise<EdgeAiProxyResponse> => {
    try {
        return await response.json() as EdgeAiProxyResponse;
    } catch {
        return {};
    }
};

const invokeGeminiProxy = async (
    payload: EdgeAiProxyPayload,
    accessToken?: string | null
): Promise<EdgeAiProxyResponse> => {
    const response = await fetch(getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
    });

    const data = await readJsonSafely(response);
    if (response.ok) {
        return data;
    }

    return {
        ...data,
        error:
            typeof data.error === 'string' && data.error.trim().length > 0
                ? data.error
                : 'Gemini proxy isteği başarısız oldu'
    };
};

export const edgeAiProxyRepository: EdgeAiProxyRepository = {
    invokeGeminiProxy
};
