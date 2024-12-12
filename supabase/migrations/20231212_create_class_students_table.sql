-- Drop existing policies if they exist
drop policy if exists "Users can view their own class enrollments" on public.class_students;
drop policy if exists "Only admins can insert class enrollments" on public.class_students;
drop policy if exists "Only admins can update class enrollments" on public.class_students;
drop policy if exists "Only admins can delete class enrollments" on public.class_students;

-- Drop and recreate the table
drop table if exists public.class_students;

-- Create the table
create table public.class_students (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    class_id uuid not null references public.classes(id) on delete cascade,
    student_id uuid not null references auth.users(id) on delete cascade,
    unique(class_id, student_id)
);

-- Enable RLS
alter table public.class_students enable row level security;

-- Create RLS policies
create policy "Users can view their own class enrollments"
    on public.class_students
    for select
    using (
        auth.uid() = student_id or
        auth.jwt()->>'email' = 'yaprakyesili@msn.com'
    );

create policy "Only admins can insert class enrollments"
    on public.class_students
    for insert
    with check (
        auth.jwt()->>'email' = 'yaprakyesili@msn.com'
    );

create policy "Only admins can update class enrollments"
    on public.class_students
    for update
    using (
        auth.jwt()->>'email' = 'yaprakyesili@msn.com'
    );

create policy "Only admins can delete class enrollments"
    on public.class_students
    for delete
    using (
        auth.jwt()->>'email' = 'yaprakyesili@msn.com'
    );

-- Create indexes
create index if not exists idx_class_students_class_id on public.class_students(class_id);
create index if not exists idx_class_students_student_id on public.class_students(student_id);
