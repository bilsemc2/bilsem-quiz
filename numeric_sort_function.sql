-- Metinden sayısal değeri çıkaran PostgreSQL fonksiyonu

CREATE OR REPLACE FUNCTION extract_number(text TEXT) 
RETURNS INTEGER AS $$
DECLARE
    number_text TEXT;
BEGIN
    -- Metin içindeki sayısal değeri bul (Soru-X formatı için)
    number_text := substring(text FROM 'Soru-([0-9]+)');
    
    -- Eğer sayı bulunamazsa, herhangi bir sayıyı aramayı dene
    IF number_text IS NULL THEN
        number_text := substring(text FROM '([0-9]+)');
    END IF;
    
    -- Eğer sayı bulunamazsa 0 döndür
    IF number_text IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Metni sayıya dönüştür
    RETURN number_text::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
