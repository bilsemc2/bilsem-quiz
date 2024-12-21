create table admin_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id),
  receiver_id uuid references auth.users(id),
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
