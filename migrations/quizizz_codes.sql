-- Create quizizz_codes table
create table if not exists public.quizizz_codes (
    id uuid default gen_random_uuid() primary key,
    code text not null,
    class_id uuid references public.classes(id) on delete cascade,
    scheduled_time timestamp with time zone not null,
    created_at timestamp with time zone default now(),
    created_by uuid references auth.users(id) on delete cascade
);

-- Add RLS policies
alter table public.quizizz_codes enable row level security;

-- Allow authenticated users to view quizizz codes
create policy "Authenticated users can view quizizz codes"
    on public.quizizz_codes for select
    to authenticated
    using (true);

-- Allow admins to insert/update/delete quizizz codes
create policy "Admins can manage quizizz codes"
    on public.quizizz_codes for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
    );

-- Create index on class_id for faster lookups
create index if not exists quizizz_codes_class_id_idx on public.quizizz_codes(class_id);

-- Create index on scheduled_time for faster date-based queries
create index if not exists quizizz_codes_scheduled_time_idx on public.quizizz_codes(scheduled_time);
