-- Accès professionnel de santé (v1), suite de 009_professional_role.sql.
-- Séparé dans son propre fichier car la valeur d'enum ajoutée en 009 ne peut
-- pas être référencée dans la même transaction que son ajout.

create type public.profession_category as enum (
  'aide_soignant', 'infirmier', 'kine', 'medecin_traitant', 'chirurgien', 'autre'
);

-- Catégorie du professionnel, uniquement pertinente quand role = 'professional'.
alter table public.family_members
  add column profession_category public.profession_category,
  add column profession_detail   text;

alter table public.family_members
  add constraint family_members_profession_only_if_professional
  check (role = 'professional' or (profession_category is null and profession_detail is null));

-- Même catégorie portée par l'invitation, copiée vers family_members à l'acceptation.
alter table public.invitations
  add column profession_category public.profession_category,
  add column profession_detail   text;

alter table public.invitations
  add constraint invitations_profession_only_if_professional
  check (role = 'professional' or (profession_category is null and profession_detail is null));

-- "Signature virtuelle" : medications n'avait jusqu'ici aucune colonne
-- "qui a écrit/modifié" (contrairement à vitals.recorded_by, doses.given_by,
-- journal_entries.author_id, documents.uploaded_by). Renseignée uniquement
-- quand un médecin traitant / chirurgien professionnel modifie le traitement
-- (voir lib/actions/health.ts) ; reste nulle pour une modification par la famille.
alter table public.medications
  add column modified_by uuid references auth.users(id),
  add column modified_at timestamptz;
