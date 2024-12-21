-- Enable RLS
alter table admin_messages enable row level security;

-- Policies for admin_messages table
create policy "Users can read their own messages"
  on admin_messages
  for select
  using (auth.uid() = receiver_id);

create policy "Admins can read all messages"
  on admin_messages
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can send messages"
  on admin_messages
  for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Users can mark their messages as read"
  on admin_messages
  for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

create policy "Users can delete their own messages"
  on admin_messages
  for delete
  using (auth.uid() = receiver_id);
