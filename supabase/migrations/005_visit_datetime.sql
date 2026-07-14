-- visit_date était une colonne `date` (pas d'heure) alors que le formulaire
-- demande une heure ("Date & heure", input datetime-local) : Postgres tronquait
-- silencieusement l'heure choisie à l'insertion. Passage en timestamptz pour
-- conserver l'instant réel. Bug découvert le 14/07/2026 (voir PROJECT_LOG.md).

drop view if exists public.week_visits;

alter table public.visits
  alter column visit_date type timestamptz using visit_date::timestamptz;

create or replace view public.week_visits as
select
  v.id, v.visit_date, v.visitor_id, v.note,
  v.parent_id, v.family_id,
  p.full_name   as visitor_name,
  (v.visit_date::date - current_date) as day_offset
from public.visits v
left join public.profiles p on p.id = v.visitor_id
where v.visit_date::date between current_date - 1 and current_date + 6;
