-- Create quiz_templates table
create table if not exists public.quiz_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  questions jsonb not null,
  scoring_rules jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.quiz_templates enable row level security;

create policy "quiz_templates_select_own"
  on public.quiz_templates for select
  using (auth.uid() = user_id);

create policy "quiz_templates_insert_own"
  on public.quiz_templates for insert
  with check (auth.uid() = user_id);

create policy "quiz_templates_update_own"
  on public.quiz_templates for update
  using (auth.uid() = user_id);

create policy "quiz_templates_delete_own"
  on public.quiz_templates for delete
  using (auth.uid() = user_id);

-- Create quiz_responses table
create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_template_id uuid not null references public.quiz_templates(id) on delete cascade,
  respondent_email text not null,
  respondent_name text,
  company_name text,
  answers jsonb not null,
  score integer,
  created_at timestamp with time zone default now()
);

alter table public.quiz_responses enable row level security;

create policy "quiz_responses_select_own"
  on public.quiz_responses for select
  using (
    exists (
      select 1 from public.quiz_templates
      where quiz_templates.id = quiz_responses.quiz_template_id
      and quiz_templates.user_id = auth.uid()
    )
  );

create policy "quiz_responses_insert_public"
  on public.quiz_responses for insert
  with check (true);
