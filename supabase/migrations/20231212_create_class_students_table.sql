-- Create class_students junction table
create table if not exists public.class_students (
    id uuid default uuid_generate_v4() primary key,
    class_id uuid references public.classes(id) on delete cascade,
    student_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(class_id, student_id)
);

-- Enable RLS
alter table public.class_students enable row level security;

-- Create policies
create policy "Class students are viewable by everyone"
    on public.class_students for select
    using (true);

create policy "Class students are insertable by admin users only"
    on public.class_students for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
            and profiles.email = 'yaprakyesili@msn.com'
        )
    );

create policy "Class students are deletable by admin users only"
    on public.class_students for delete
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
            and profiles.email = 'yaprakyesili@msn.com'
        )
    );

-- Create indexes
create index if not exists class_students_class_id_idx on public.class_students(class_id);
create index if not exists class_students_student_id_idx on public.class_students(student_id);
