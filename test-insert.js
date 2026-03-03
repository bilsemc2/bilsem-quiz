import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testInsert() {
    // Login as a user to get an auth session (we can't just insert without a valid JWT if RLS requires auth.uid())
    // However, I don't have a user's email/password. 
    // Maybe I can just use the service role key to insert, but 400 is not RLS (401/403 is RLS).
    // 400 Bad Request in PostgREST is a structural error (column not found, invalid JSON, constraint violation).

    // Let's just try to insert with a random UUID to see if it gives a schema error or foreign key error.
    const { data, error } = await supabase.from('music_test_results').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // invalid foreign key
        test_type: 'single-note',
        score: 100,
        accuracy: 100,
        feedback: { strengths: ["a"], improvements: ["b"], tips: ["c"] }
    });

    console.log("Insert Response:");
    console.log("Data:", data);
    console.log("Error:", error);
}

testInsert().catch(console.error);
