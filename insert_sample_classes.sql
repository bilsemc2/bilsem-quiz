-- Örnek sınıfları ekle
INSERT INTO classes (name, grade, icon, created_by)
VALUES 
  ('5A Sınıfı', 5, 'school', 'ADMIN_USER_ID'),
  ('6B Sınıfı', 6, 'school', 'ADMIN_USER_ID'),
  ('Matematik Kulübü', 5, 'calculate', 'ADMIN_USER_ID'),
  ('Kodlama Kulübü', 6, 'code', 'ADMIN_USER_ID'),
  ('Bilim Kulübü', 7, 'science', 'ADMIN_USER_ID');

-- Örnek öğrenci-sınıf ilişkilerini ekle
INSERT INTO class_students (class_id, student_id)
SELECT 
  c.id,
  p.id
FROM classes c
CROSS JOIN profiles p
WHERE p.grade = c.grade
LIMIT 5;
