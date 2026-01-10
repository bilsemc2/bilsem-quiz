-- bilgi_kartlari tablosu oluşturma
CREATE TABLE IF NOT EXISTS public.bilgi_kartlari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik TEXT NOT NULL,
    icerik TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- RLS policies
ALTER TABLE public.bilgi_kartlari ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "bilgi_kartlari_read_policy" ON public.bilgi_kartlari
    FOR SELECT USING (true);
