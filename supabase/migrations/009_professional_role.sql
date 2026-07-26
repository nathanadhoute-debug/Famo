-- Accès professionnel de santé (v1) : un professionnel invité par la famille,
-- avec une catégorie affichée mais un seul niveau d'accès pour toutes les
-- catégories sauf médecin traitant/chirurgien qui peuvent seuls modifier le
-- traitement (voir requireMembership / addMedication / deactivateMedication).
--
-- Étape 1, seule dans son bloc : une valeur d'enum ajoutée ne peut pas être
-- référencée dans la même transaction que son ajout (contrainte Postgres).
alter type public.member_role add value 'professional';
