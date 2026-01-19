-- Örüntü Avcısı (oruntulu-top) için XP gereksinimi ekle
INSERT INTO xp_requirements (page_path, required_xp, description) 
VALUES ('/arcade/oruntulu-top', 35, 'Örüntü Avcısı - Arcade Oyunu')
ON CONFLICT (page_path) DO UPDATE 
SET required_xp = 35;
