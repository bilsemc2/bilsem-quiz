-- Copy name values to full_name column
update public.profiles 
set full_name = name 
where name is not null and (full_name is null or full_name = '');

-- After copying, we can drop the name column if you want
-- alter table public.profiles drop column if exists name;
