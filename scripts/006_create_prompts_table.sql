-- Create prompts table
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null,
  category text not null default 'General',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.prompts enable row level security;

create policy "prompts_select_own"
  on public.prompts for select
  using (auth.uid() = user_id);

create policy "prompts_insert_own"
  on public.prompts for insert
  with check (auth.uid() = user_id);

create policy "prompts_update_own"
  on public.prompts for update
  using (auth.uid() = user_id);

create policy "prompts_delete_own"
  on public.prompts for delete
  using (auth.uid() = user_id);
