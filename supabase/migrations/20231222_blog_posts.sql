-- Blog posts tablosu
create table blog_posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  author_id uuid references profiles(id) not null,
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  slug TEXT UNIQUE
);

-- RLS politikaları
alter table blog_posts enable row level security;

-- Herkes yayınlanmış blog yazılarını okuyabilir
create policy "Anyone can read published blog posts"
  on blog_posts
  for select
  using (published = true);

-- Adminler tüm blog yazılarını okuyabilir
create policy "Admins can read all blog posts"
  on blog_posts
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Sadece adminler blog yazısı ekleyebilir
create policy "Only admins can insert blog posts"
  on blog_posts
  for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Sadece adminler blog yazılarını düzenleyebilir
create policy "Only admins can update blog posts"
  on blog_posts
  for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Sadece adminler blog yazılarını silebilir
create policy "Only admins can delete blog posts"
  on blog_posts
  for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

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
    AND id != COALESCE(NEW.id, -1)
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
