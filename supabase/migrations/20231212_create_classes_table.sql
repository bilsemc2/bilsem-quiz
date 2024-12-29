-- Create classes table
create table if not exists public.classes (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    grade integer not null,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    icon text not null default 'school' -- Material UI icon name
);

-- Drop existing policies
drop policy if exists "Allow read access to all users" on public.classes;
drop policy if exists "Allow insert access to admin users" on public.classes;
drop policy if exists "Allow update access to admin users" on public.classes;
drop policy if exists "Allow delete access to admin users" on public.classes;

-- Drop and recreate the table
drop table if exists public.classes cascade;

create table public.classes (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    grade integer not null,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    icon text not null default 'school'
);

-- Enable RLS
alter table public.classes enable row level security;

-- Create policies
create policy "Allow read access to all users"
    on public.classes
    for select
    using (true);

create policy "Allow insert access to admin users"
    on public.classes
    for insert
    with check (
        auth.jwt()->>'email' = 'yaprakyesili@msn.com'
    );

create policy "Allow update access to admin users"
    on public.classes
    for update
    using (
        auth.jwt()->>'email' = 'yaprakyesili@msn.com'
    );

create policy "Allow delete access to admin users"
    on public.classes
    for delete
    using (
        auth.jwt()->>'email' = 'yaprakyesili@msn.com'
    );

-- Create indexes
create index if not exists classes_grade_idx on public.classes(grade);
create index if not exists classes_created_by_idx on public.classes(created_by);
