-- Create classes table
create table if not exists public.classes (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    grade integer not null,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.classes enable row level security;

-- Create policies
create policy "Classes are viewable by everyone"
    on public.classes for select
    using (true);

create policy "Classes are insertable by admin users only"
    on public.classes for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
            and profiles.email = 'yaprakyesili@msn.com'
        )
    );

create policy "Classes are updatable by admin users only"
    on public.classes for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
            and profiles.email = 'yaprakyesili@msn.com'
        )
    );

create policy "Classes are deletable by admin users only"
    on public.classes for delete
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
            and profiles.email = 'yaprakyesili@msn.com'
        )
    );

-- Create indexes
create index if not exists classes_grade_idx on public.classes(grade);
create index if not exists classes_created_by_idx on public.classes(created_by);
