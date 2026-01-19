-- Kart Dedektifi (kart-dedektifi) için XP gereksinimi ekle
INSERT INTO xp_requirements (page_path, required_xp, description) 
VALUES ('/arcade/kart-dedektifi', 40, 'Kart Dedektifi - Arcade Oyunu')
ON CONFLICT (page_path) DO UPDATE 
SET required_xp = 40;
