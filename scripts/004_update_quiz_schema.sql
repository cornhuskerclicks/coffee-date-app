-- Add 'name' field for internal quiz identification
alter table public.quiz_templates 
add column if not exists name text;

-- Update existing quizzes to have a name based on their title
update public.quiz_templates 
set name = title 
where name is null;
