-- Görsel analiz sonuçlarını saklamak için tablo
CREATE TABLE image_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_url TEXT NOT NULL,
    analysis_result JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS politikaları
ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;

-- Herkes kendi analizlerini görebilir
CREATE POLICY "Users can view own analyses" ON image_analyses
    FOR SELECT
    USING (auth.uid() = created_by);

-- Herkes kendi analizlerini oluşturabilir
CREATE POLICY "Users can create own analyses" ON image_analyses
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Herkes kendi analizlerini silebilir
CREATE POLICY "Users can delete own analyses" ON image_analyses
    FOR DELETE
    USING (auth.uid() = created_by);
