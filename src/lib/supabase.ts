import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biltdannugeaosqgjryo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbHRkYW5udWdlYW9zcWdqcnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NzIwNjgsImV4cCI6MjA0OTE0ODA2OH0.-KXgbwXpB0KD6dpmQEhmzfg7v-6XdRzrGz7DOnKMflM';

export const supabase = createClient(supabaseUrl, supabaseKey);
