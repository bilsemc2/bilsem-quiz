-- Add is_vip column to profiles table
alter table public.profiles 
  add column if not exists is_vip boolean default false;
