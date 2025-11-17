-- Add profile_image_url column to profiles table
alter table public.profiles
add column if not exists profile_image_url text;

-- Create storage bucket for profile images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

-- Set up storage policies for profile images
create policy "Users can upload their own profile images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profiles' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own profile images"
on storage.objects for update
to authenticated
using (bucket_id = 'profiles' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own profile images"
on storage.objects for delete
to authenticated
using (bucket_id = 'profiles' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Profile images are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'profiles');
