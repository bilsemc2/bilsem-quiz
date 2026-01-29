-- Pricing Packages & User Subscriptions Migration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  price_renewal DECIMAL(10,2),
  type TEXT NOT NULL CHECK (type IN ('xp_based', 'credit_based', 'time_based', 'bundle')),
  initial_credits INTEGER,
  xp_required INTEGER,
  features JSONB DEFAULT '[]',
  includes TEXT[] DEFAULT '{}',
  payment_url TEXT,
  whatsapp_url TEXT,
  qr_code_url TEXT,
  is_recommended BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  credits_remaining INTEGER,
  xp_remaining INTEGER,
  expires_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);

-- 4. Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for packages
DROP POLICY IF EXISTS "Public can read active packages" ON packages;
CREATE POLICY "Public can read active packages" ON packages 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage packages" ON packages;
CREATE POLICY "Admins can manage packages" ON packages 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 6. RLS Policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions 
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON user_subscriptions 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 7. Updated_at trigger for packages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Seed initial packages
INSERT INTO packages (slug, name, description, price, price_renewal, type, initial_credits, xp_required, features, includes, payment_url, whatsapp_url, is_recommended, sort_order) 
VALUES
  ('pro', 'Bireysel Değerlendirme - PRO', 
   'Genel Yetenek, Resim ve Müzik modüllerini kapsar. Tam kapsamlı hazırlık paketi.', 
   9999, NULL, 'bundle', NULL, NULL, 
   '["Genel Yetenek Simülatörleri", "Resim Analizi (Sınırsız)", "Müzik Eğitimi (Sınav Tarihine Kadar)", "VIP Destek", "Tüm Beyin Eğitimi Oyunları"]',
   ARRAY['genel_yetenek', 'resim', 'muzik'],
   'https://www.paytr.com/link/fHufWAE',
   'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme PRO paketi hakkında bilgi almak istiyorum.',
   true, 1),

  ('standard', 'Bireysel Değerlendirme - Standart', 
   'XP miktarınıza göre fiyatlandırma. En az 10.000 XP ile başlayın.', 
   1000, NULL, 'xp_based', NULL, 10000,
   '["Genel Yetenek Simülatörleri", "Beyin Eğitimi Oyunları", "XP Bitene Kadar Erişim"]',
   ARRAY['genel_yetenek'],
   NULL,
   'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme Standart paketi hakkında bilgi almak istiyorum.',
   false, 2),

  ('resim', 'Bireysel Değerlendirme - Resim', 
   'Resim analizi hakkı. 30 analiz ile başlayın, daha sonra ek hak satın alın.', 
   3000, 1500, 'credit_based', 30, NULL,
   '["30 Resim Analizi Hakkı", "Detaylı Geri Bildirim", "İlerleme Takibi"]',
   ARRAY['resim'],
   NULL,
   'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme Resim paketi hakkında bilgi almak istiyorum.',
   false, 3),

  ('muzik', 'Bireysel Değerlendirme - Müzik', 
   'Müzik modülüne sınav tarihine kadar tam erişim.', 
   3000, NULL, 'time_based', NULL, NULL,
   '["Ritim Eğitimi", "Nota Tanıma", "Melodi Eşleştirme", "Sınav Tarihine Kadar Erişim"]',
   ARRAY['muzik'],
   NULL,
   'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme Müzik paketi hakkında bilgi almak istiyorum.',
   false, 4)
ON CONFLICT (slug) DO NOTHING;

-- Done!
SELECT 'Migration completed successfully!' as result;
