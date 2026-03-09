/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_ELEVENLABS_API_KEY: string
    readonly VITE_ENABLE_ADAPTIVE_DIFFICULTY_V2?: string
    readonly VITE_ADAPTIVE_DIFFICULTY_MAX_STEP?: string
    readonly VITE_ADAPTIVE_DIFFICULTY_UP_TREND_ACCURACY_THRESHOLD?: string
    readonly VITE_ADAPTIVE_DIFFICULTY_DOWN_TREND_ACCURACY_THRESHOLD?: string
    readonly VITE_ADAPTIVE_DIFFICULTY_RESPONSE_TREND_THRESHOLD?: string
    readonly VITE_ENABLE_HYBRID_DIFFICULTY_AI?: string
    readonly VITE_ADAPTIVE_DIFFICULTY_MAX_AI_DELTA?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
