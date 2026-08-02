-- Photo de profil du proche (parent) : la colonne parents.avatar_url existe
-- déjà depuis la migration 002 mais n'avait jamais été branchée à l'UI —
-- seul le bucket de stockage manque. Bucket PUBLIC (contrairement à
-- "documents") car la photo est affichée en continu dans plusieurs endroits
-- de l'UI (hero pro, sélecteur de proche) — une URL signée à courte durée de
-- vie casserait l'affichage après expiration. Chemin de fichier avec UUID
-- aléatoire pour rester non devinable malgré le bucket public.

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "avatars_select" on storage.objects for select using (
  bucket_id = 'avatars'
);
create policy "avatars_insert" on storage.objects for insert with check (
  bucket_id = 'avatars' and public.is_family_member((storage.foldername(name))[1]::uuid)
);
create policy "avatars_update" on storage.objects for update using (
  bucket_id = 'avatars' and public.is_family_member((storage.foldername(name))[1]::uuid)
);
create policy "avatars_delete" on storage.objects for delete using (
  bucket_id = 'avatars' and public.is_family_admin((storage.foldername(name))[1]::uuid)
);
