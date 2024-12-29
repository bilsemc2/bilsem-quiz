-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('image-analysis', 'image-analysis', true);

-- RLS politikaları
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'image-analysis');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'image-analysis'
  AND auth.role() = 'authenticated'
);
