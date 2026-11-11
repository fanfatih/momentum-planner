-- Foto galeri dan musik latar undangan. Bucket publik supaya tamu bisa membuka tanpa login;
-- yang boleh menulis hanya anggota proyek premium, dan hanya di folder proyeknya sendiri.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-media', 'invitation-media', true, 6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Nama file berbentuk <wedding_id>/<nama>. Fungsi ini hanya lolos bila folder pertama adalah UUID proyek
-- milik pemanggil dan proyek itu premium. CASE menjaga cast ke uuid tidak jalan untuk nama sembarang.
create function public.can_write_media(p_name text) returns boolean
language sql stable set search_path = '' as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_member(split_part(p_name, '/', 1)::uuid) and public.is_premium(split_part(p_name, '/', 1)::uuid)
    else false
  end;
$$;

revoke execute on function public.can_write_media(text) from public, anon;
grant execute on function public.can_write_media(text) to authenticated;

create policy invitation_media_read on storage.objects for select to authenticated
  using (bucket_id = 'invitation-media' and public.can_write_media(name));
create policy invitation_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'invitation-media' and public.can_write_media(name));
create policy invitation_media_update on storage.objects for update to authenticated
  using (bucket_id = 'invitation-media' and public.can_write_media(name))
  with check (bucket_id = 'invitation-media' and public.can_write_media(name));
create policy invitation_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'invitation-media' and public.can_write_media(name));
