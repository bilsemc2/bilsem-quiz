-- Create drawing_submissions table
create table public.drawing_submissions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    image_url text not null,
    words text[] not null,
    feedback text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up storage
insert into storage.buckets (id, name, public) values ('drawings', 'drawings', true);

-- Set up storage policies
create policy "Authenticated users can upload drawings"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'drawings' 
    and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Drawings are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'drawings');

-- Set up RLS
alter table public.drawing_submissions enable row level security;

create policy "Users can view all submissions"
on public.drawing_submissions for select
to authenticated
using (true);

create policy "Users can insert their own submissions"
on public.drawing_submissions for insert
to authenticated
with check (auth.uid() = user_id);