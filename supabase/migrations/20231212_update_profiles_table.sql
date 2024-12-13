-- Add new columns to profiles table if they don't exist
alter table public.profiles 
  add column if not exists is_active boolean default true,
  add column if not exists full_name text;

-- Update existing policies
drop policy if exists "Profiles are viewable by users who created them" on profiles;
drop policy if exists "Profiles are editable by users who created them" on profiles;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Profiles are updatable by admin users only"
  on profiles for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
      and profiles.email = 'yaprakyesili@msn.com'
    )
  );
