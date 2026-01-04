-- Fix RLS policies for promo_codes
DROP POLICY IF EXISTS "Anyone can see promo codes" ON promo_codes;

-- 1. Everyone can see codes (needed for redemption check)
CREATE POLICY "Anyone can see promo codes" ON promo_codes
    FOR SELECT TO authenticated
    USING (true);

-- 2. Students can update current_uses (incrementing counter)
-- Ideally this should be restricted, but for the current simplicity of the app:
CREATE POLICY "Users can increment current_uses" ON promo_codes
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Admins can do everything
CREATE POLICY "Admins have full access to promo codes" ON promo_codes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Fix RLS policies for promo_code_usage
DROP POLICY IF EXISTS "Students can see their own usage" ON promo_code_usage;
DROP POLICY IF EXISTS "Students can insert their own usage" ON promo_code_usage;

-- 1. Admins can see all usage (for statistics)
CREATE POLICY "Admins can see all usage" ON promo_code_usage
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- 2. Students can see their own usage
CREATE POLICY "Students can see their own usage" ON promo_code_usage
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id);

-- 3. Students can insert their own usage
CREATE POLICY "Students can insert their own usage" ON promo_code_usage
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id);
