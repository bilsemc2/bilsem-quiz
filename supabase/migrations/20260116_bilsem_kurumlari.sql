-- BİLSEM Kurumları Tablosu
-- Türkiye'deki tüm BİLSEM kurumlarının bilgilerini tutar

CREATE TABLE IF NOT EXISTS public.bilsem_kurumlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  il_adi TEXT NOT NULL,
  ilce_adi TEXT NOT NULL,
  kurum_adi TEXT NOT NULL,
  kurum_tur_adi TEXT,
  adres TEXT,
  telefon_no TEXT,
  fax_no TEXT,
  mernis_adres_kodu TEXT,
  web_adres TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performans için indexler
CREATE INDEX IF NOT EXISTS idx_bilsem_il ON public.bilsem_kurumlari(il_adi);
CREATE INDEX IF NOT EXISTS idx_bilsem_ilce ON public.bilsem_kurumlari(ilce_adi);
CREATE INDEX IF NOT EXISTS idx_bilsem_slug ON public.bilsem_kurumlari(slug);

-- Full-text arama için index
CREATE INDEX IF NOT EXISTS idx_bilsem_search ON public.bilsem_kurumlari 
USING gin(to_tsvector('simple', coalesce(kurum_adi, '') || ' ' || coalesce(il_adi, '') || ' ' || coalesce(ilce_adi, '')));

-- RLS - Herkes okuyabilir
ALTER TABLE public.bilsem_kurumlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bilsem" ON public.bilsem_kurumlari;
CREATE POLICY "Public read bilsem" ON public.bilsem_kurumlari FOR SELECT USING (true);

-- Admin insert/update/delete
DROP POLICY IF EXISTS "Admin manage bilsem" ON public.bilsem_kurumlari;
CREATE POLICY "Admin manage bilsem" ON public.bilsem_kurumlari 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

COMMENT ON TABLE public.bilsem_kurumlari IS 'Türkiye genelindeki BİLSEM kurumlarının dizini';
