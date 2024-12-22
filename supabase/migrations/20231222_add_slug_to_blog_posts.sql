-- Add slug column to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase and replace Turkish characters
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      REGEXP_REPLACE(
                        title,
                        '[^a-zA-Z0-9\s-]', '', 'g'
                      ),
                      'ı', 'i', 'g'
                    ),
                    'ğ', 'g', 'g'
                  ),
                  'ü', 'u', 'g'
                ),
                'ş', 's', 'g'
              ),
              'ö', 'o', 'g'
            ),
            'ç', 'c', 'g'
          ),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate slug
CREATE OR REPLACE FUNCTION update_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- Generate base slug from title
  base_slug := generate_slug(NEW.title);
  new_slug := base_slug;
  counter := 1;
  
  -- Check for duplicate slugs and append number if needed
  WHILE EXISTS (
    SELECT 1 FROM blog_posts 
    WHERE slug = new_slug 
    AND id != NEW.id
  ) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS before_insert_update_blog_posts ON blog_posts;

-- Create trigger
CREATE TRIGGER before_insert_update_blog_posts
  BEFORE INSERT OR UPDATE OF title
  ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_slug();

-- Update existing posts to generate slugs
UPDATE blog_posts SET slug = generate_slug(title) WHERE slug IS NULL;
