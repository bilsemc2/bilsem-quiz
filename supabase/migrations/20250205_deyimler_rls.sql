-- Deyimler tablosu için RLS'yi etkinleştir
ALTER TABLE deyimler ENABLE ROW LEVEL SECURITY;

-- Tüm politikaları temizle
DROP POLICY IF EXISTS "Deyimler okuma politikası" ON deyimler;
DROP POLICY IF EXISTS "Deyimler admin politikası" ON deyimler;

-- Oturum açmış tüm kullanıcılar için okuma politikası
CREATE POLICY "Deyimler okuma politikası"
ON deyimler
FOR SELECT
TO authenticated
USING (
  -- Kullanıcının XP'si 1000'den fazlaysa erişim ver
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.experience >= 1000
  )
);

-- Sadece adminler için tam yetki politikası
CREATE POLICY "Deyimler admin politikası"
ON deyimler
FOR ALL
TO authenticated
USING (
  -- Kullanıcı admin rolüne sahipse erişim ver
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
