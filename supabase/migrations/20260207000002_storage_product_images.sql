-- Bucket for product/service images (public read, upload by tenant members)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Product images: tenant members can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and auth.uid() in (
    select user_id from public.tenant_memberships
    where tenant_id = ((storage.foldername(name))[1])::uuid
  )
);

create policy "Product images: tenant members can update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and auth.uid() in (
    select user_id from public.tenant_memberships
    where tenant_id = ((storage.foldername(name))[1])::uuid
  )
);

create policy "Product images: public read" on storage.objects for
select to public using (bucket_id = 'product-images');