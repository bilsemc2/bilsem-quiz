-- Referral sayılarını düzelt
CREATE OR REPLACE FUNCTION fix_referral_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tüm referral_count değerlerini sıfırla
  UPDATE profiles SET referral_count = 0;
  
  -- Her profil için referral sayısını hesapla ve güncelle
  UPDATE profiles p
  SET referral_count = (
    SELECT COUNT(*)
    FROM profiles ref
    WHERE ref.referred_by = p.referral_code
  )
  WHERE p.referral_code IS NOT NULL;
END;
$$;

-- Fonksiyonu çalıştır
SELECT fix_referral_counts();

-- Trigger'ı güncelle
CREATE OR REPLACE FUNCTION handle_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Davet eden kullanıcıya XP ver ve referral sayısını artır
    UPDATE profiles
    SET 
        experience = experience + 50,
        referral_count = (
            SELECT COUNT(*)
            FROM profiles ref
            WHERE ref.referred_by = profiles.referral_code
        )
    WHERE referral_code = NEW.referred_by;
    
    RETURN NEW;
END;
$$;
