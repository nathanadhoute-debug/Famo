-- Un professionnel de santé peut être restreint à un ou plusieurs proches
-- précis du cercle plutôt qu'à tous — un cercle qui suit deux proches ne
-- veut pas forcément que le kiné de l'un voie les données de l'autre.
-- L'admin qui invite choisit les proches autorisés ; laisser vide autorise
-- tous les proches actuels (comportement précédent, conservé pour les
-- lignes déjà existantes créées avant cette migration).

alter table public.invitations
  add column authorized_parent_ids uuid[];

alter table public.family_members
  add column authorized_parent_ids uuid[];
